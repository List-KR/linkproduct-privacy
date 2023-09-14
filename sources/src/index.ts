import { GM, GM_xmlhttpRequest } from './GM-API'
import { LinkProductURLs, LinkResultURLs } from './LinkProduct'

// unsafeWindow interface
type unsafeWindow = typeof window
declare const unsafeWindow: unsafeWindow

(function () {
  const GMXmlhttpRequest = typeof GM.xmlhttpRequest !== 'undefined' ? GM.xmlhttpRequest : GM_xmlhttpRequest

  let LinkElements = Array.from(document.querySelectorAll(LinkProductURLs.filter(function (LinkProductURL) {
    return typeof LinkProductURL.OnSite === 'undefined' || document.location.hostname.includes(LinkProductURL.OnSite)
  }).map(function(Value) { return `a[href*="${Value.URLPattern}"]` }).join(', '))) as Array<HTMLAnchorElement>
  console.debug('linkproduct-privacy: LinkElements: ', LinkElements)
  for (let LinkElement of LinkElements) {
    let URLAddress = LinkElement.getAttribute('href')
    if (URLAddress === null) {
      console.warn('linkproduct-privacy: URLAddress is null.', LinkElement)
      continue
    }
    GMXmlhttpRequest({url: URLAddress, method: 'GET', responseType: 'document', anonymous: true, onload: function (ResponseObject) {
      let UpdateURL: string
      let ResponseURL = ResponseObject.responseURL || ResponseObject.finalUrl
      for (let i = 0; i < LinkResultURLs.length; i++) {
        if (LinkResultURLs[i].URLPattern.test(ResponseURL)) {
          UpdateURL = LinkResultURLs[i].ModificationFunction(ResponseURL, LinkElement)
          console.debug('linkproduct-privacy: The reponse URL matches a predefined URL:', {
            'Element': LinkElement, 'Affiliate marketing URL': URLAddress, 'Response URL': ResponseURL, 'Processed URL': UpdateURL
          })
          break
        }
        if (LinkResultURLs.length - 1 === i) {
          UpdateURL = ResponseURL
          console.warn('linkproduct-privacy: The reponse URL does NOT match any predefined URL:', {
            'Element': LinkElement, 'Affiliate marketing URL': URLAddress, 'Response URL': ResponseURL
          })
        }
      }
      LinkElement.setAttribute('href', UpdateURL)
      if (/^(http(s|):)?\/\/.+\..+\/.+/.test(LinkElement.innerText)) LinkElement.innerText = UpdateURL
    }})
  }
})()