const $$ = (document, selector) => document.querySelectorAll(selector)
const $ = require('ramda')
    const map = $.map
    const merge = $.merge
    const range = $.range
        const range1 = range(1)
    const unnest = $.unnest
const process = require('process')
const getopt = require('meow')
    const opts = getopt(`
    Usage
      $ ${process.argv[1]} <uri>

    Options
      --html-table, -t  Output html table representation
      --page-count, -n  Count of the pages to crawl
    `)
    opts.uri = opts.input
    const uri = opts.uri || 'https://www.avito.ru/moskva/telefony/iphone?bt=1&q=iphone+se'
        const getPageUri = page => `${uri}&p=${page}`
    const isHtmlTable = opts.flags.htmlTable
const TableBuilder = require('table-builder')
    const table = new TableBuilder({class: 'avito'})
    const headers = {price: 'Price', title: 'Title', mem: 'Storage', color: 'Color', uri: 'Uri'}
    const leftpad3 = val => require('leftpad')(val, 3)
    const htmlTable = data => table
        .setHeaders(headers)
        .setPrism('uri', uri => `<a href="${uri}">link</a>`)
        .setPrism('price', p => `${parseInt(p / 1000)} ${leftpad3(p % 1000)}`)
        .setPrism('mem', m => m || '—')
        .setPrism('color', c => c.toLowerCase() || '—')
        .setData(data)
        .render()
const thrw = require('throw')
const fetch = require('isomorphic-fetch')
    const getHttp = uri => fetch(uri).then(r => r.status >= 400 ? thrw (r.status) : r.text())
const parseHtml = html => require('jsdom').jsdom(html)
const Uri = require('urijs')
    const hostname = (uri, hostname) => hostname ? Uri(uri).hostname(hostname).toString() : Uri(uri).hostname()

const retreiveData = document =>
    Array.from($$(document, '.js-catalog_after-ads .item'))
    .map(i => map(p=>i.querySelector(p), {title: '.title', price: '.about', uri: '.item-description-title-link'}))
    .map(i => merge(i, {uri: i.uri.getAttribute('href')}))
    .map(i => map(t => typeof t === 'string' ? t : t.textContent.trim(), i))

const processData = data => data
    .map(i => (merge(i, {price: +i.price.replace(/\s+|руб\./g, '')})))
    .filter(i => i.title.match(/se/i))
    .map(i => i.title.match(/A1723/i) ? merge(i, {a1723:true}) : i)
    .map(i => merge(i, {title: i.title.replace(/(iPhone|Apple|айфон|Прода[мю])\s?/ig, '')}))
    .filter(i => !i.title.match(/\b(6|7|5S|Samsung|7plus|6plus)\b/ig))
    .sort((i, j) => i.price < j.price ? 1 : -1)
    .map(i => merge(i, {mem: +(i.title.match(/64|32|16/) || [NaN])[0]}))
    .map(i => merge(i, {color: (i.title.match(/rose|rosegold|gold|pink|silver|black|gr[ea]y|розовый|золотой|серый|серебристый|ч[ёе]рный/i) || [''])[0]}))
    .map(i => merge(i, {color: {rose:'gold',grey:'space gray',gray:'space gray',золотой:'gold',серебристый:'silver'}[i.color] || i.color}))
    .map(i => merge(i, {uri: i.uri.match(/^(https?:)?\/\//) ? i.uri : 'https:' + hostname(i.uri, hostname(uri))}))

const htmlOutput = data => {
    const style = `<style>body{text-align:center;}.avito{width:100%;}thead{text-align:left;}.price-td{text-align:right;}</style>`
    return htmlTable(data)
}

const main = () =>
    Promise.all(range1(opts.flags.pageCount || 5).map(i => getHttp(getPageUri(i)).then(parseHtml).then(retreiveData)))
    .then(dataArr => unnest(dataArr))
    .then(processData)
    .then(data => isHtmlTable ? htmlOutput(data) : JSON.stringify(data, null, 4))

main().then(r=>{console.log(r); process.exit(0)})
