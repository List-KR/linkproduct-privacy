// ==UserScript==
// @name         linkproduct-privacy
// @encoding     utf-8
// @namespace    https://github.com/List-KR/linkproduct-privacy
// @homepageURL  https://github.com/List-KR/linkproduct-privacy
// @supportURL   https://github.com/List-KR/linkproduct-privacy/issues
// @updateURL    https://cdn.jsdelivr.net/gh/List-KR/linkproduct-privacy@main/linkproduct-privacy.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/List-KR/linkproduct-privacy@main/linkproduct-privacy.user.js
// @license      MIT
//
// @version      2.0.2
// @author       List-KR
//
// @match        *://*/*
// @connect      *
//
// @description        linkproduct-privacy gets the original URL from an affiliate marketing URL.
// @description:ko     linkproduct-privacy는 제휴 마케팅 URL에서 원본 URL을 가져옵니다.
//
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// @noframes
// ==/UserScript==

(function () {
  'use strict'

  const rulesUrl = 'https://raw.githubusercontent.com/List-KR/linkproduct-privacy/main/rules.json'
  const rulesCacheKey = 'rules-cache'
  const requestedUrls = new WeakMap()

  function parseHttpUrl(value) {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new TypeError(`Unsupported URL protocol: ${url.protocol}`)
    }
    return url
  }

  function matchesHost(hostname, hosts) {
    return hosts.some(host => hostname === host || hostname.endsWith(`.${host}`))
  }

  function parameterNameMatches(name, expectedName, ignoreCase) {
    return ignoreCase
      ? name.toLowerCase() === expectedName.toLowerCase()
      : name === expectedName
  }

  function compileUrlRule(rule) {
    const flags = rule.caseInsensitive ? 'i' : ''
    return {
      ...rule,
      hostRegex: rule.hostPattern ? new RegExp(rule.hostPattern, flags) : null,
      pathRegex: rule.pathPattern ? new RegExp(rule.pathPattern, flags) : null
    }
  }

  function compileRules(source) {
    const collectionNames = ['affiliateLinks', 'redirects', 'destinations', 'pageLinks']
    if (source?.schemaVersion !== 1 || collectionNames.some(name => !Array.isArray(source[name]))) {
      throw new TypeError('Unsupported rules schema')
    }
    if (source.affiliateLinks.some(rule =>
      typeof rule.hrefIncludes !== 'string' ||
      (rule.pageHosts && !Array.isArray(rule.pageHosts))
    )) {
      throw new TypeError('Invalid affiliate link rule')
    }
    if (source.redirects.some(rule =>
      !Array.isArray(rule.hosts) ||
      (typeof rule.targetParameter !== 'string' && rule.targetText !== true)
    )) {
      throw new TypeError('Invalid redirect rule')
    }
    if (source.pageLinks.some(rule =>
      typeof rule.selector !== 'string' ||
      !Array.isArray(rule.unwrapOrigins)
    )) {
      throw new TypeError('Invalid page link rule')
    }

    return {
      affiliateLinks: source.affiliateLinks,
      redirects: source.redirects.map(compileUrlRule),
      destinations: source.destinations.map(compileUrlRule),
      pageLinks: source.pageLinks.map(rule => ({
        ...compileUrlRule(rule),
        unwrapOrigins: rule.unwrapOrigins.map(value => parseHttpUrl(value).origin)
      }))
    }
  }

  function readCachedRules() {
    try {
      const cached = GM_getValue(rulesCacheKey, null)
      if (!cached || typeof cached.source !== 'string') {
        return null
      }
      return {
        source: cached.source,
        rules: compileRules(JSON.parse(cached.source))
      }
    } catch (error) {
      console.warn('linkproduct-privacy: ignored invalid rules cache', error)
      return null
    }
  }

  function fetchRules(cachedSource) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: rulesUrl,
        anonymous: true,
        timeout: 10000,
        onload(response) {
          try {
            if (response.status < 200 || response.status >= 300) {
              throw new Error(`Rules request failed with HTTP ${response.status}`)
            }
            const source = response.responseText
            const rules = compileRules(JSON.parse(source))
            if (source !== cachedSource) GM_setValue(rulesCacheKey, { source })
            resolve(rules)
          } catch (error) {
            reject(error)
          }
        },
        onerror: () => reject(new Error('Rules request failed')),
        ontimeout: () => reject(new Error('Rules request timed out'))
      })
    })
  }

  function loadRules() {
    const cached = readCachedRules()
    return fetchRules(cached?.source).catch(error => {
      if (!cached) throw error
      console.warn('linkproduct-privacy: using cached rules after refresh failed', error)
      return cached.rules
    })
  }

  function matchesUrl(rule, url) {
    if (rule.hosts && !matchesHost(url.hostname, rule.hosts)) return false
    if (rule.hostRegex && !rule.hostRegex.test(url.hostname)) return false
    if (rule.pathRegex && !rule.pathRegex.test(url.pathname)) return false
    if (rule.requiredParameters && !rule.requiredParameters.every(expectedName =>
      [...url.searchParams.keys()].some(name =>
        parameterNameMatches(name, expectedName, rule.parameterNamesIgnoreCase)
      )
    )) return false
    return true
  }

  function createAffiliateSelector(linkRules) {
    return linkRules
      .filter(rule => !rule.pageHosts || matchesHost(location.hostname, rule.pageHosts))
      .map(rule => `a[href*="${rule.hrefIncludes.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"]`)
      .join(', ')
  }

  function unwrapUrl(responseUrl, linkElement, rules) {
    const url = parseHttpUrl(responseUrl)
    const rule = rules.redirects.find(candidate => matchesUrl(candidate, url))
    if (!rule) return url

    const targetUrl = rule.targetParameter
      ? url.searchParams.get(rule.targetParameter)
      : linkElement.textContent.trim()
    return targetUrl ? parseHttpUrl(targetUrl) : url
  }

  function cleanUrl(responseUrl, linkElement, rules) {
    const url = unwrapUrl(responseUrl, linkElement, rules)
    for (const rule of rules.destinations.filter(candidate => matchesUrl(candidate, url))) {
      const keptParameters = rule.keepParameters
        ? [...url.searchParams].filter(([name]) => rule.keepParameters.some(expectedName =>
          parameterNameMatches(name, expectedName, rule.parameterNamesIgnoreCase)
        ))
        : []

      if (rule.pathReplacement) url.pathname = url.pathname.replace(rule.pathRegex, rule.pathReplacement)
      if (rule.clearParameters || rule.keepParameters) url.search = ''
      for (const [name, value] of keptParameters) url.searchParams.append(name, value)
      for (const name of [...url.searchParams.keys()]) {
        const shouldDelete = (rule.deleteParameters || []).some(expectedName =>
          parameterNameMatches(name, expectedName, rule.parameterNamesIgnoreCase)
        ) || (rule.deleteParameterPrefixes || []).some(prefix =>
          rule.parameterNamesIgnoreCase
            ? name.toLowerCase().startsWith(prefix.toLowerCase())
            : name.startsWith(prefix)
        )
        if (shouldDelete) {
          url.searchParams.delete(name)
        }
      }
      if (rule.clearHash) url.hash = ''
    }
    return url.href
  }

  function restorePageLink(linkElement, rule) {
    try {
      let url = parseHttpUrl(linkElement.href)
      const targetUrl = rule.targetParameter && url.searchParams.get(rule.targetParameter)
      if (targetUrl) {
        url = parseHttpUrl(targetUrl)
        if (linkElement.href !== url.href) linkElement.href = url.href
      } else if (rule.unwrapOrigins.includes(url.origin)) {
        let originalUrl = url.pathname.slice(1) + url.search + url.hash
        if (!/^https?:\/\//i.test(originalUrl)) originalUrl = decodeURIComponent(originalUrl)
        url = parseHttpUrl(originalUrl)
        if (linkElement.href !== url.href) linkElement.href = url.href
      }
      return true
    } catch (error) {
      console.warn('linkproduct-privacy: could not restore page link', { linkElement, error })
      return false
    }
  }

  function restorePageLinks(root, pageRules) {
    for (const rule of pageRules) {
      if (root.matches?.(rule.selector)) restorePageLink(root, rule)
      root.querySelectorAll?.(rule.selector).forEach(linkElement => restorePageLink(linkElement, rule))
    }
  }

  function updateLink(linkElement, rules) {
    const affiliateUrl = linkElement.href
    if (requestedUrls.get(linkElement) === affiliateUrl) return
    requestedUrls.set(linkElement, affiliateUrl)

    const requestFailed = (message, error) => {
      requestedUrls.delete(linkElement)
      console.warn(message, { linkElement, affiliateUrl, error })
    }

    GM_xmlhttpRequest({
      method: 'GET',
      url: affiliateUrl,
      anonymous: true,
      timeout: 15000,
      onload(response) {
        try {
          const responseUrl = response.finalUrl || response.responseURL
          if (!responseUrl || linkElement.href !== affiliateUrl) return

          const updatedUrl = cleanUrl(responseUrl, linkElement, rules)
          linkElement.href = updatedUrl
          requestedUrls.set(linkElement, updatedUrl)

          if (/^https?:\/\//i.test(linkElement.textContent.trim())) {
            linkElement.textContent = updatedUrl
          }

          console.debug('linkproduct-privacy: updated link', {
            linkElement,
            affiliateUrl,
            responseUrl,
            updatedUrl
          })
        } catch (error) {
          requestFailed('linkproduct-privacy: could not process link', error)
        }
      },
      onerror(error) {
        requestFailed('linkproduct-privacy: request failed', error)
      },
      ontimeout() {
        requestFailed('linkproduct-privacy: request timed out')
      }
    })
  }

  function processAffiliateLinks(root, selector, rules) {
    if (!selector) return
    if (root.matches?.(selector)) updateLink(root, rules)
    root.querySelectorAll?.(selector).forEach(linkElement => updateLink(linkElement, rules))
  }

  function start(rules) {
    if (!document.documentElement) {
      document.addEventListener('DOMContentLoaded', () => start(rules), { once: true })
      return
    }

    const pageRuleCandidates = rules.pageLinks.filter(rule =>
      (!rule.hosts || matchesHost(location.hostname, rule.hosts)) &&
      (!rule.hostRegex || rule.hostRegex.test(location.hostname))
    )
    const getPageRules = () => {
      const pageUrl = parseHttpUrl(location.href)
      return pageRuleCandidates.filter(rule => matchesUrl(rule, pageUrl))
    }
    const affiliateSelector = createAffiliateSelector(rules.affiliateLinks)

    restorePageLinks(document, getPageRules())
    processAffiliateLinks(document, affiliateSelector, rules)

    if (pageRuleCandidates.length > 0) {
      document.addEventListener('click', event => {
        for (const rule of getPageRules()) {
          const linkElement = event.target.closest?.(rule.selector)
          if (!linkElement || !restorePageLink(linkElement, rule)) continue
          if (rule.stopImmediatePropagation) event.stopImmediatePropagation()
          return
        }
      }, true)
    }

    new MutationObserver(mutations => {
      const pageRules = getPageRules()
      for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
          restorePageLinks(mutation.target, pageRules)
          processAffiliateLinks(mutation.target, affiliateSelector, rules)
          continue
        }

        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue
          restorePageLinks(node, pageRules)
          processAffiliateLinks(node, affiliateSelector, rules)
        }
      }
    }).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['href', 'is-expanded'],
      childList: true,
      subtree: true
    })
  }

  loadRules()
    .then(start)
    .catch(error => console.warn('linkproduct-privacy: could not load rules', error))
})()
