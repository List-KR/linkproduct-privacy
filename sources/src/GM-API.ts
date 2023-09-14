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
export declare const GM: GM
export declare const GM_xmlhttpRequest: typeof GM.xmlhttpRequest