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
// @version      1.0.0
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
(function () {
    const LinkProductURLs = [
        '//app.ac/',
        '//link.coupang.com/a/'
    ];
    let LinkElements = document.querySelectorAll(LinkProductURLs.map(function (Value) { return `a[href*="${Value}"]`; }).join(', '));
    console.debug('linkproduct-privacy: LinkElements: ', LinkElements);
    for (let LinkElement of LinkElements) {
        let URLAddress = LinkElement.getAttribute('href');
        if (URLAddress === null) {
            console.warn('linkproduct-privacy: URLAddress is null.', LinkElement);
            continue;
        }
        GM.xmlhttpRequest({ url: URLAddress, method: 'GET', responseType: 'document', anonymous: true, onload: function (ResponseObject) {
                LinkElement.setAttribute('href', ResponseObject.finalUrl);
                LinkElement.innerText = ResponseObject.finalUrl;
                console.debug('linkproduct-privacy: Completed for:', { 'Element': LinkElement, 'Affiliate marketing URL': URLAddress });
            } });
    }
})();
