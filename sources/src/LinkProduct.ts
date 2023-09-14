interface LinkResultURL {
  URLPattern: RegExp,
  ModificationFunction: (ResultURL: string, ResultElement?: HTMLAnchorElement) => string
}
interface LinkProductURL {
  URLPattern: string
  OnSite?: string
}

export const LinkProductURLs: Array<LinkProductURL> = [
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
export const LinkResultURLs: Array<LinkResultURL> = [
  {
    URLPattern: /^https:\/\/[a-z]+\.gmarket\.co\.kr\/linkprice\/lpfront\.asp/,
    ModificationFunction: function (ResultURL: string) {
      let SearchParamsURL = new URL(ResultURL).searchParams.get('url')
      let OriginalURL = new URL(SearchParamsURL)
      OriginalURL.searchParams.delete('jaehuid')
      return OriginalURL.href
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