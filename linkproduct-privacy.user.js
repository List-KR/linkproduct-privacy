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
// @version      1.2.4
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
(function () {
    const GMXmlhttpRequest = typeof GM.xmlhttpRequest !== 'undefined' ? GM.xmlhttpRequest : GM_xmlhttpRequest;
    const LinkProductURLs = [
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
    ];
    const LinkResultURLs = [
        {
            URLPattern: /^https:\/\/[a-z]+\.gmarket\.co\.kr\/linkprice\/lpfront\.asp/,
            ModificationFunction: function (ResultURL) {
                let SearchParamsURL = new URL(ResultURL).searchParams.get('url');
                let OriginalURL = new URL(SearchParamsURL);
                OriginalURL.searchParams.delete('jaehuid');
                return OriginalURL.href;
            }
        },
        {
            URLPattern: /^https:\/\/[a-z]+\.wemakeprice\.com\/product\/[0-9]+/,
            ModificationFunction: function (ResultURL) {
                let Oringin = new URL(ResultURL).origin;
                let Pathname = new URL(ResultURL).pathname;
                return Oringin + Pathname;
            }
        },
        {
            URLPattern: /^https:\/\/[a-z]+\.coupang\.com\/vp\/products\/[0-9]+/,
            ModificationFunction: function (ResultURL) {
                let Oringin = new URL(ResultURL).origin;
                let Pathname = new URL(ResultURL).pathname;
                return Oringin + Pathname;
            }
        },
        {
            URLPattern: /^https?:\/\/m?item(page[0-9]+)?\.auction\.co\.kr\/[A-z]+(\.[a-z]+)?\?item(N|n)o=[A-z0-9]+/,
            ModificationFunction: function (ResultURL) {
                return /^https?:\/\/m?item(page[0-9]+)?\.auction\.co\.kr\/[A-z]+(\.[a-z]+)?\?item(N|n)o=[A-z0-9]+/.exec(ResultURL)[0];
            }
        },
        {
            URLPattern: /^https:\/\/(www|m)\.qoo10\.com\/g\/[0-9]+/,
            ModificationFunction: function (ResultURL) {
                return /^https:\/\/(www|m)\.qoo10\.com\/g\/[0-9]+/.exec(ResultURL)[0];
            }
        },
        {
            URLPattern: /^https:\/\/(www|m)\.e-himart\.co\.kr\/common\/include\/ipfront.jsp\?lpinfo=/,
            ModificationFunction: function (ResultURL) {
                return new URL(ResultURL).searchParams.get('url');
            }
        },
        {
            URLPattern: /^https?:\/\/(www|m)\.11st\.co\.kr\/connect\/Gateway\.tmall\?apInfo=.+&lpUrl=/,
            ModificationFunction: function (ResultURL) {
                let LpURL = new URL(ResultURL).searchParams.get('lpUrl');
                return new URL(LpURL).search === '' ? LpURL : new URL(LpURL).origin + new URL(LpURL).pathname;
            }
        },
        {
            URLPattern: /^https:\/\/[a-z]+\.coupang\.com\/np\/campaigns\/[0-9]+/,
            ModificationFunction: function (ResultURL) {
                let Oringin = new URL(ResultURL).origin;
                let Pathname = new URL(ResultURL).pathname;
                return Oringin + Pathname;
            }
        },
        {
            URLPattern: /^https:\/\/pages\.coupang\.com\/p\/[A-z0-9]+/,
            ModificationFunction: function (ResultURL) {
                let Oringin = new URL(ResultURL).origin;
                let Pathname = new URL(ResultURL).pathname;
                return Oringin + Pathname;
            }
        },
        {
            URLPattern: /^https:\/\/[a-z]+\.lotteon\.com\/m\/product\/[A-z0-9]+/,
            ModificationFunction: function (ResultURL) {
                let Oringin = new URL(ResultURL).origin;
                let Pathname = new URL(ResultURL).pathname;
                return Oringin + Pathname;
            }
        },
        {
            URLPattern: /^https:\/\/(m\.)?[a-z]+\.aliexpress\.com\/item\/[0-9]+\.html/,
            ModificationFunction: function (ResultURL) {
                let Oringin = new URL(ResultURL).origin;
                let Pathname = new URL(ResultURL).pathname;
                return Oringin + Pathname;
            }
        },
        {
            URLPattern: /^https:\/\/etoland\.co\.kr\/bbs\/link\.php\?bo_table=hot&/,
            ModificationFunction: function (ResultURL, ResultElement) {
                return ResultElement.innerText;
            }
        }
    ];
    let LinkElements = Array.from(document.querySelectorAll(LinkProductURLs.filter(function (LinkProductURL) {
        return typeof LinkProductURL.OnSite === 'undefined' || document.location.hostname.includes(LinkProductURL.OnSite);
    }).map(function (Value) { return `a[href*="${Value.URLPattern}"]`; }).join(', ')));
    console.debug('linkproduct-privacy: LinkElements: ', LinkElements);
    for (let LinkElement of LinkElements) {
        let URLAddress = LinkElement.getAttribute('href');
        if (URLAddress === null) {
            console.warn('linkproduct-privacy: URLAddress is null.', LinkElement);
            continue;
        }
        GMXmlhttpRequest({ url: URLAddress, method: 'GET', responseType: 'document', anonymous: true, onload: function (ResponseObject) {
                let UpdateURL;
                let ResponseURL = ResponseObject.responseURL || ResponseObject.finalUrl;
                for (let i = 0; i < LinkResultURLs.length; i++) {
                    if (LinkResultURLs[i].URLPattern.test(ResponseURL)) {
                        UpdateURL = LinkResultURLs[i].ModificationFunction(ResponseURL, LinkElement);
                        console.debug('linkproduct-privacy: The reponse URL matches a predefined URL:', {
                            'Element': LinkElement, 'Affiliate marketing URL': URLAddress, 'Response URL': ResponseURL, 'Processed URL': UpdateURL
                        });
                        break;
                    }
                    if (LinkResultURLs.length - 1 === i) {
                        UpdateURL = ResponseURL;
                        console.warn('linkproduct-privacy: The reponse URL does NOT match any predefined URL:', {
                            'Element': LinkElement, 'Affiliate marketing URL': URLAddress, 'Response URL': ResponseURL
                        });
                    }
                }
                LinkElement.setAttribute('href', UpdateURL);
                if (/^(http(s|):)?\/\/.+\..+\/.+/.test(LinkElement.innerText))
                    LinkElement.innerText = UpdateURL;
            } });
    }
})();
