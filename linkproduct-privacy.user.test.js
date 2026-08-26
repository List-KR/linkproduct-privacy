const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { test } = require('node:test')
const vm = require('node:vm')

const script = readFileSync('linkproduct-privacy.user.js', 'utf8')
const rulesSource = readFileSync('rules.json', 'utf8')
const rulesUrl = 'https://cdn.jsdelivr.net/gh/List-KR/linkproduct-privacy@main/rules.json'

const flushPromises = () => new Promise(resolve => setImmediate(resolve))

async function resolveLinks(cases) {
  const links = cases.map(({ affiliateUrl }) => ({
    href: affiliateUrl,
    textContent: affiliateUrl
  }))
  const responses = new Map(cases.map(({ affiliateUrl, responseUrl }) => [affiliateUrl, responseUrl]))

  vm.runInNewContext(script, {
    console: { debug() {}, warn() {} },
    document: {
      documentElement: {},
      querySelectorAll: () => links
    },
    GM_getValue: () => null,
    GM_setValue() {},
    GM_xmlhttpRequest({ url, onload }) {
      if (url === rulesUrl) {
        onload({ responseText: rulesSource, status: 200 })
      } else {
        onload({ finalUrl: responses.get(url) })
      }
    },
    location: { href: 'https://example.com/', hostname: 'example.com' },
    MutationObserver: class {
      observe() {}
    },
    Node: { ELEMENT_NODE: 1 },
    URL
  })

  await flushPromises()
  return links.map(({ href }) => href)
}

test('loads rules and removes tracking without breaking redirect links', async () => {
  const cases = [
    {
      affiliateUrl: 'https://click.linkprice.com/click.php?m=gmarket&a=test',
      responseUrl: 'https://link.gmarket.co.kr/gate/channel?target-url=https%3A%2F%2Fitem.gmarket.co.kr%2FItem%3Fgoodscode%3D123%26jaehuid%3Daffiliate',
      expectedUrl: 'https://item.gmarket.co.kr/Item?goodscode=123'
    },
    {
      affiliateUrl: 'https://app.ac/example',
      responseUrl: 'https://linkmoa.kr/click.php?tu=https%3A%2F%2Fwww.coupang.com%2Fvp%2Fproducts%2F123%3FitemId%3D456%26vendorItemId%3D789%26lptag%3Daffiliate',
      expectedUrl: 'https://www.coupang.com/vp/products/123?itemId=456&vendorItemId=789'
    },
    {
      affiliateUrl: 'https://link.coupang.com/re/AFF?itemId=456&subid=required',
      responseUrl: 'https://link.coupang.com/re/AFF?itemId=456&subid=required',
      expectedUrl: 'https://link.coupang.com/re/AFF?itemId=456&subid=required'
    },
    {
      affiliateUrl: 'https://s.click.aliexpress.com/e/example',
      responseUrl: 'https://www.aliexpress.com/item/100500123.html?aff_fcid=affiliate&terminal_id=tracking',
      expectedUrl: 'https://www.aliexpress.com/item/100500123.html'
    },
    {
      affiliateUrl: 'https://click.linkprice.com/click.php?m=auction&a=test',
      responseUrl: 'https://itempage3.auction.co.kr/DetailView.aspx?itemNo=C123&frm=tracking',
      expectedUrl: 'https://itempage3.auction.co.kr/DetailView.aspx?itemNo=C123'
    },
    {
      affiliateUrl: 'https://temu.to/k/example',
      responseUrl: 'https://www.temu.com/goods.html?goods_id=601101489097930&_x_ads_channel=affiliate',
      expectedUrl: 'https://www.temu.com/goods.html?goods_id=601101489097930'
    },
    {
      affiliateUrl: 'https://amzn.to/example',
      responseUrl: 'https://www.amazon.com/Atomic-Habits/dp/0735211299?linkCode=sl1&tag=affiliate-20',
      expectedUrl: 'https://www.amazon.com/dp/0735211299'
    },
    {
      affiliateUrl: 'https://link.adpick.co.kr/example',
      responseUrl: 'https://www.lotteon.com/m/product/example?affiliate=tracking',
      expectedUrl: 'https://www.lotteon.com/m/product/example'
    }
  ]

  assert.deepEqual(await resolveLinks(cases), cases.map(({ expectedUrl }) => expectedUrl))
})

test('restores Arcalive links without decoding escaped path separators', async () => {
  const originalUrl = 'https://example.com/products/a%2Fb?item=123'
  const link = {
    href: `https://unsafelink.com/${originalUrl}`,
    matches: selector => selector === '.article-options a.external',
    textContent: originalUrl
  }
  let clickHandler

  vm.runInNewContext(script, {
    console: { debug() {}, warn() {} },
    document: {
      addEventListener(type, handler) {
        if (type === 'click') clickHandler = handler
      },
      documentElement: {},
      querySelectorAll: selector => selector === '.article-options a.external' ? [link] : []
    },
    GM_getValue: () => null,
    GM_setValue() {},
    GM_xmlhttpRequest({ url, onload }) {
      if (url === rulesUrl) onload({ responseText: rulesSource, status: 200 })
      else assert.fail('restored links should not make an affiliate request')
    },
    location: {
      href: 'https://arca.live/b/hotdeal/123',
      hostname: 'arca.live'
    },
    MutationObserver: class {
      observe() {}
    },
    Node: { ELEMENT_NODE: 1 },
    URL
  })

  await flushPromises()
  assert.equal(link.href, originalUrl)
  let propagationStopped = false
  clickHandler({
    stopImmediatePropagation() {
      propagationStopped = true
    },
    target: { closest: () => link }
  })
  assert.equal(propagationStopped, true)
})

test('keeps site-specific knowledge in rules.json', () => {
  for (const domain of ['arca.live', 'coupang.com', 'aliexpress.com', 'amazon']) {
    assert.equal(script.includes(domain), false)
    assert.equal(rulesSource.includes(domain), true)
  }
})
