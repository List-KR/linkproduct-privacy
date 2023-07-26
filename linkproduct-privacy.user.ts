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
// @version      0.0.1
// @author       PiQuark6046 and contributors
//
// @match        *://*/*
//
// @description        linkproduct-privacy can get original URL from an affiliate marketing URL.
// @description:ko     linkproduct-privacy는 인플루언서 마케팅 URL에서 원본 URL을 얻을 수 있습니다.
//
// @grant        unsafeWindow
// @grant        GM.xmlhttpRequest
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
  finalUrl: string,
  context: any
}
type GM = {
  xmlhttpRequest: (details: GMXMLHttpRequestDetails) => { abort: (ResponseObject?: GMXMLHttpRequestResponse) => void }
}
declare const GM: GM

(function () {
  
})()