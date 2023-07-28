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
// @version      1.2.3
// @author       PiQuark6046 and contributors
//
// @match        *://*/*
//
// @description        linkproduct-privacy can get original URL from an affiliate marketing URL.
// @description:ko     linkproduct-privacy는 인플루언서 마케팅 URL에서 원본 URL을 얻을 수 있습니다.
//
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// ==/UserScript==

// unsafeWindow interface
type unsafeWindow = typeof window
declare const unsafeWindow: unsafeWindow

// GM.xmlhttpRequest interface - https://violentmonkey.github.io/api/gm/#gm_xmlhttprequest
interface GMXMLHttpRequestDetails {
  url: string,
  method?: 'GET' | 'POST' | 'HEAD' | 'PUT' | 'DELETE',
  user?: string,
  password?: string,
  overrideMimeType?: string,
  headers?: {
    [key: string]: string
  },
  responseType?: 'arraybuffer' | 'blob' | 'json' | 'text' | 'document',
  timeout?: number,
  data?: string | FormData | Blob | ArrayBuffer | DataView | URLSearchParams | FormData | ReadableStream,
  binary?: boolean,
  context?: any,
  anonymous?: boolean,
  onabort?: (ResponseObject: GMXMLHttpRequestResponse) => void,
  onerror?: (ResponseObject: GMXMLHttpRequestResponse) => void,
  onload?: (ResponseObject: GMXMLHttpRequestResponse) => void,
  onloadend?: (ResponseObject: GMXMLHttpRequestResponse) => void,
  onloadstart?: (ResponseObject: GMXMLHttpRequestResponse) => void,
  onprogress?: (ResponseObject: GMXMLHttpRequestResponse) => void,
  onreadystatechange?: (ResponseObject: GMXMLHttpRequestResponse) => void,
  ontimeout?: (ResponseObject: GMXMLHttpRequestResponse) => void
}
interface GMXMLHttpRequestResponse {
  status: number,
  statusText: string,
  readyState: number,
  responseHeaders: string,
  response: string | Blob | ArrayBuffer | Document | Object | null,
  responseText: string | undefined,
  responseXML: Document | undefined,
  lengthComputable: boolean,
  loaded: number,
  totla: number,
  finalUrl?: string,
  responseURL?: string,
  context: any
}
type GM = {
  xmlhttpRequest: (details: GMXMLHttpRequestDetails) => { abort: (ResponseObject?: GMXMLHttpRequestResponse) => void }
}
declare const GM: GM
type GM_xmlhttpRequest = typeof GM.xmlhttpRequest
declare const GM_xmlhttpRequest: GM_xmlhttpRequest

interface LinkResultURL {
  URLPattern: RegExp,
  ModificationFunction: (ResultURL: string, ResultElement?: HTMLAnchorElement) => string
}
interface LinkProductURL {
  URLPattern: string
  OnSite?: string
}

(function () {
  const GMXmlhttpRequest = typeof GM.xmlhttpRequest !== 'undefined' ? GM.xmlhttpRequest : GM_xmlhttpRequest
  const LinkProductURLs: Array<LinkProductURL> = [
    {
      URLPattern: '//app.ac/'
    },
    {
      URLPattern: '//link.coupang.com/a/'
    },
    {
      URLPattern: '//link.coupang.com/a/'
    },
    {
      URLPattern: '//link.coupang.com/re/'
    },
    {
      URLPattern: '//qoo.tn/'
    },
    {
      URLPattern: '//s.click.aliexpress.com/s/'
    },
    {
      URLPattern: 'bbs/link.php?bo_table=hot&',
      OnSite: 'etoland.co.kr'
    },
    {
      URLPattern: '//click.linkprice.com/click.php?'
    }
  ]
  const LinkResultURLs: Array<LinkResultURL> = [
    {
      URLPattern: /^https:\/\/[a-z]+\.gmarket\.co\.kr\/linkprice\/lpfront\.asp/,
      ModificationFunction: function (ResultURL: string) {
        let SearchParamsURL = new URL(ResultURL).searchParams.get('url')
        return /^https:\/\/m?item\.gmarket\.co\.kr\/(detailview\/)?Item(\.asp)?\?goodscode=[0-9]+/.exec(SearchParamsURL)[0]
      }
    },
    {
      URLPattern: /^https:\/\/[a-z]+\.wemakeprice\.com\/product\/[0-9]+/,
      ModificationFunction: function (ResultURL: string) {
        let Oringin = new URL(ResultURL).origin
        let Pathname = new URL(ResultURL).pathname
        return Oringin + Pathname
      }
    },
    {
      URLPattern: /^https:\/\/[a-z]+\.coupang\.com\/vp\/products\/[0-9]+/,
      ModificationFunction: function (ResultURL: string) {
        let Oringin = new URL(ResultURL).origin
        let Pathname = new URL(ResultURL).pathname
        return Oringin + Pathname
      }
    },
    {
      URLPattern: /^https?:\/\/m?item(page[0-9]+)?\.auction\.co\.kr\/[A-z]+(\.[a-z]+)?\?item(N|n)o=[A-z0-9]+/,
      ModificationFunction: function (ResultURL: string) {
        return /^https?:\/\/m?item(page[0-9]+)?\.auction\.co\.kr\/[A-z]+(\.[a-z]+)?\?item(N|n)o=[A-z0-9]+/.exec(ResultURL)[0]
      }
    },
    {
      URLPattern: /^https:\/\/(www|m)\.qoo10\.com\/g\/[0-9]+/,
      ModificationFunction: function (ResultURL: string) {
        return /^https:\/\/(www|m)\.qoo10\.com\/g\/[0-9]+/.exec(ResultURL)[0]
      }
    },
    {
      URLPattern: /^https:\/\/(www|m)\.e-himart\.co\.kr\/common\/include\/ipfront.jsp\?lpinfo=/,
      ModificationFunction: function (ResultURL: string) {
        return new URL(ResultURL).searchParams.get('url')
      }
    },
    {
      URLPattern: /^https?:\/\/(www|m)\.11st\.co\.kr\/connect\/Gateway\.tmall\?apInfo=.+&lpUrl=/,
      ModificationFunction: function (ResultURL: string) {
        let LpURL = new URL(ResultURL).searchParams.get('lpUrl')
        return new URL(LpURL).search === '' ? LpURL : new URL(LpURL).origin + new URL(LpURL).pathname
      }
    },
    {
      URLPattern: /^https:\/\/[a-z]+\.coupang\.com\/np\/campaigns\/[0-9]+/,
      ModificationFunction: function (ResultURL: string) {
        let Oringin = new URL(ResultURL).origin
        let Pathname = new URL(ResultURL).pathname
        return Oringin + Pathname
      }
    },
    {
      URLPattern: /^https:\/\/pages\.coupang\.com\/p\/[A-z0-9]+/,
      ModificationFunction: function (ResultURL: string) {
        let Oringin = new URL(ResultURL).origin
        let Pathname = new URL(ResultURL).pathname
        return Oringin + Pathname
      }
    },
    {
      URLPattern: /^https:\/\/[a-z]+\.lotteon\.com\/m\/product\/[A-z0-9]+/,
      ModificationFunction: function (ResultURL: string) {
        let Oringin = new URL(ResultURL).origin
        let Pathname = new URL(ResultURL).pathname
        return Oringin + Pathname
      }
    },
    {
      URLPattern: /^https:\/\/(m\.)?[a-z]+\.aliexpress\.com\/item\/[0-9]+\.html/,
      ModificationFunction: function (ResultURL: string) {
        let Oringin = new URL(ResultURL).origin
        let Pathname = new URL(ResultURL).pathname
        return Oringin + Pathname
      }
    },
    {
      URLPattern: /^https:\/\/etoland\.co\.kr\/bbs\/link\.php\?bo_table=hot&/,
      ModificationFunction: function (ResultURL: string, ResultElement: HTMLAnchorElement) {
        return ResultElement.innerText
      }
    }
  ]
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