const process = require('process')
const tableBuilder = require('table-builder')
    const table = tableBuilder({class: 'avito'})
    const headers = {price:'price', title:'title'}
const thrw = require('throw')
const fetch = require('isomorphic-fetch')
    const getHttp = (uri) => fetch.then(r => r.status >= 400 ? thrw (r.status) : r.body)
const parseHtml = html => require('parse5').parse(html)

const uri = process.argv[2] || 'https://www.avito.ru/moskva/telefony/iphone?q=iphone+se'

const retreiveData = (document) => Array.from(document.querySelectorAll('.js-catalog_after-ads .item')).map(i=>({title:i.querySelector('.title'), price:i.querySelector('.about')})).map(({title,price})=>({title:title.textContent.trim(),price:price.textContent.trim()}))

const main = async function () {
    const html = await getHttp(uri)
    const document = await parseHtml(html)
    const data = retreiveData(document)

    return table.setHeaders(headers).setData(data).render()
}
console.log(main())
