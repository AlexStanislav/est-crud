

const { v4: uuidv4 } = require('uuid');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const bikesInfo = {}
const bikesLinks = []

const getInfoMotoboom = async (url, type, tableName, categoryUrl) => {
    const browser = await puppeteer.launch({ headless: "new" })
    const page = await browser.newPage()

    await page.goto(url, { waitUntil: "networkidle0", timeout: 0 })

    const $ = cheerio.load(await page.content());

    bikesInfo[tableName] = {}
    bikesLinks[tableName] = []

    $('.product-item').each((index, element) => {
        const link = $(element).find('a').attr('href')
        if (bikesLinks[tableName] && (link.includes(type) && link.includes('.html'))) {
            bikesLinks[tableName].push(link)
            bikesLinks[tableName] = [...new Set(bikesLinks[tableName])]
        }
    })


    $('.product-item').each(async (index, element) => {
        const imageData = $(element).find('.img-default-image').attr('src')
        const bikeName = $(element).find('div.denumire_wrap').find('a').text().toLocaleLowerCase().split(' ').join('-')
        const price = $(element).find('.price-new').text().split(" ")[0] !== "" ? $(element).find('.price-new').text().split(" ")[0] : $(element).find('.price').text().split(" ")[0].trim()
        const oldPrice = $(element).find('span.price-old').text().split(" ")[0] || null
        const currency = "EUR"
        const getMainYear = function () {
            if ($(element).find('.inner').find('a').attr('href') !== undefined) {
                const year = $(element).find('.inner').find('a').attr('href').split('/')[3].replace(".html", "").split("-").pop()
                return year
            }
        }

        const bikeObj = {
            bikeName,
            bikeSlogan: null,
            bikeDesc: null,
            mainYear: getMainYear(),
            priceInfo: {
                price,
                oldPrice,
                currency
            },
            image: imageData,
            gallery: [],
            category: null
        }

        if (bikeName !== "") {
            bikesInfo[tableName][bikeName] = bikeObj
        }

    })

    for (const link of bikesLinks[tableName]) {
        if (link === undefined) continue
        if (link.includes(type) && link.includes('.html')) {
            await page.goto(link, { waitUntil: "networkidle0", timeout: 0 })
            const content = await page.content()
            if (typeof content === 'string') {
                const $ = cheerio.load(content)

                const bikeName = $('.product-info-details').find('h1').text().trim().toLowerCase().split(' ').join('-');

                const bikeSlogan = $('.product-tags').find('a').text();
                const bikeDesc = $('#tab-description').text();
                const rabla = $('.product-tags').find('a');
                let hasRabla = "nu"

                const specifications = $('#tab-specification').find('.d-flex')
                const specificationDetails = specifications.map((index, element) => {
                    const [label, value] = $(element).text().trim().split(':')
                    return {
                        label: `${label}`,
                        value: value
                    }
                })

                rabla.map((index, element) => {
                    if ($(element).attr('href').toLowerCase().includes('rabla')) {
                        hasRabla = "da"
                    }
                })


                const infoArray = []

                for (const detail of specificationDetails) {
                    if (detail.label.toLowerCase().includes('capacitate')) {
                        infoArray.push(detail)
                    }
                }

                for (const detail of infoArray) {
                    if (detail.label.toLowerCase().includes("model")) {
                        if (bikes[bikeName]) {
                            bikes[bikeName].mainYear = detail.value
                            infoArray.splice(infoArray.indexOf(detail), 1)
                        }
                    }
                }

                const gallery = []

                $('.sub-image').each(async (index, element) => {
                    const image = $(element).find('img').attr('src')
                    gallery.push(image)
                })

                if (bikesInfo[tableName][bikeName]) {
                    bikesInfo[tableName][bikeName].bikeSlogan = bikeSlogan;
                    bikesInfo[tableName][bikeName].bikeDesc = bikeDesc;
                    bikesInfo[tableName][bikeName].hasRabla = hasRabla
                    bikesInfo[tableName][bikeName].gallery = gallery;
                    bikesInfo[tableName][bikeName].info = infoArray
                } else {
                    console.log("Bike not found: ", bikeName)
                }

                console.log("Bike scraped: ", bikeName)
            }
        }
    }

    if (tableName === 'kawasaki') {

        await page.goto(categoryUrl, { waitUntil: "networkidle0" })

        const html = cheerio.load(await page.content());

        html('div.filtercomponent__category').each((index, categoryElement) => {
            const category = html(categoryElement).find('h2').text().trim().toLowerCase().split(' ').join('-').replace("/", "");

            html(categoryElement).find('.productcard__container').each((index, bikeElement) => {
                const bikeName = html(bikeElement).find('h4.title__text--h4').text().trim().toLowerCase().split(' ').join('-');

                for (const bikeIndex in bikesInfo[tableName]) {
                    const bikeId = bikeIndex.replace('kawasaki-', '').replace('-', '');
                    const bikeTitle = bikeName.replace('-', '');

                    if (bikeId.includes(bikeTitle)) {
                        bikesInfo[tableName][bikeIndex].category = category;
                    }
                }
            });
        });
    }

    browser.close().then(() => { console.log(`${tableName} scraped`) })
}

const getInfoAspGroup = async (url, tableName) => {
    const browser = await puppeteer.launch({ headless: "new" })
    const page = await browser.newPage()

    await page.goto(url, { waitUntil: "networkidle0" })

    const $ = cheerio.load(await page.content());

    bikesInfo[tableName] = {}
    bikesLinks[tableName] = []

    $('.vehicles-item').each((index, element) => {
        const link = $(element).find('a').attr('href')
        bikesLinks[tableName].push(link)
        bikesLinks[tableName] = [...new Set(bikesLinks[tableName])]
    })

    for (const link of bikesLinks[tableName]) {
        if (link === undefined) continue

        const finalLink = `https://www.aspgroup.ro${link}`

        await page.goto(finalLink, { waitUntil: "networkidle0" })

        const $ = cheerio.load(await page.content())

        const bikeName = finalLink.split("/")[3]

        const getSlogan = async function () {
            const sloganArray = []
            const slogan = $('.module-text').find('h3')

            const sloganPromises = slogan.map((index, element) => {
                return $(element).text()
            }).get()

            const resolvedSlogan = await Promise.all(sloganPromises)

            sloganArray.push(resolvedSlogan)

            return sloganArray
        }

        const bikeSloganInfo = await getSlogan()
        const bikeSlogan = bikeSloganInfo[0][0]


        const getDesc = async function () {
            const desc = []
            const element = $('.order1').find('p')

            const elementPromises = element.map((index, element) => {
                return $(element).text()
            }).get()

            const resolvedElement = await Promise.all(elementPromises)

            desc.push(resolvedElement)

            return desc
        }

        const bikeDesc = await getDesc()

        const priceInfoElement = $('.price-wrapper').text().split("De la")

        let oldPrice = null
        let priceInfo = null

        if (priceInfoElement.length === 3) {
            priceInfo = [priceInfoElement[1].replace("(TVA inclus)\n\nOmologare", "").split("€")[0].trim(), priceInfoElement[2].replace("(TVA inclus)\n\nOmologare", "").split("€")[0].trim()]

            const oldPriceArray = priceInfoElement[1].replace("(TVA inclus)\n\nOmologare", "").split("€")

            if (oldPriceArray.length === 3) {
                oldPrice = oldPriceArray[0].trim()
                priceInfo = [oldPriceArray[1].trim(), priceInfoElement[2].replace("(TVA inclus)\n\nOmologare", "").split("€")[0].trim()]
            }
        } else {
            priceInfo = priceInfoElement[1].replace("(TVA inclus)\n\nOmologare", "").split("€")[0].trim()

            const oldPriceArray = priceInfoElement[1].replace("(TVA inclus)\n\nOmologare", "").split("€")

            if (oldPriceArray.length === 3) {
                oldPrice = oldPriceArray[0].trim()
                priceInfo = oldPriceArray[1].trim()
            }
        }

        const getInfo = async function () {
            const info = []
            const element = $('tr')
            const infoPromises = element.map((index, element) => {
                if ($(element).text().includes("Capacitate cilindrică")) {
                    return $(element).text()
                }
            }).get()

            const resolvedInfo = await Promise.all(infoPromises)

            info.push(resolvedInfo)

            return info
        }

        const motorInfoElement = await getInfo()

        const motorInfo = (motorInfoElement[0][0] !== undefined ? motorInfoElement[0][0].replace(/\D/g, "") : null)

        const imageData = `https://aspgroup.ro${$('.slick-slide').first().attr("style").replace("background-image", "").replace(":", "").replace("url", "").split(";")[0].replace(/\"/g, "").replace(/[\(\)]+/g, "").trim()}`

        const getGallery = async function () {
            const gallery = []
            const galleryElement = $('figure').find('a')

            const galleryPromises = galleryElement.map((index, element) => {
                return `https://aspgroup.ro${$(element).attr('href')}`
            }).get()

            const resolvedGallery = await Promise.all(galleryPromises)

            gallery.push(...resolvedGallery)

            return gallery
        }

        const gallery = await getGallery()

        const category = link.split("-")[0].replace("https://www.aspgroup.ro/", "")

        const bikeObj = {
            bikeName,
            bikeSlogan,
            bikeDesc: bikeDesc[0][0],
            mainYear: null,
            priceInfo: {
                price: priceInfo,
                oldPrice,
                currency: "EUR"
            },
            category: category,
            image: imageData,
            gallery,
            info: [
                {
                    label: "Capacitate cilindrica",
                    value: `${motorInfo}cc`
                }
            ]
        }

        bikesInfo[tableName][bikeName] = bikeObj

        console.log(`Bike scraped: ${bikeName}`)
    }

    browser.close().then(() => { console.log(`${tableName} scraped`) })
}

const getInfoAtvRom = async (url, tableName) => {
    const browser = await puppeteer.launch({ headless: "new" })
    const page = await browser.newPage()

    await page.goto(url, { waitUntil: "networkidle0" })

    const $ = cheerio.load(await page.content());

    if (!bikesInfo[tableName]) bikesInfo[tableName] = {}
    if (!bikesLinks[tableName]) bikesLinks[tableName] = []

    const getLinks = async function () {
        const element = $('a')
        const links = []

        const elementPromise = element.map(async (index, element) => {
            if ($(element).attr('title') === "Vezi detalii") {
                return $(element).attr('href')
            }
        }).get()

        const resolvedElement = await Promise.all(elementPromise)

        links.push(...resolvedElement)

        return links
    }

    bikesLinks[tableName] = await getLinks()

    for (const link of bikesLinks[tableName]) {
        if (link === undefined) {
            continue
        }

        await page.goto(link, { waitUntil: "networkidle0" })

        const $ = cheerio.load(await page.content())

        const bikeName = $('h1').text().trim()

        const bikeNameArray = bikeName.split("'")
        const mainYear = bikeNameArray[1] ? `20${bikeNameArray[1]}` : null

        const getGallery = async function () {
            const gallery = []

            const galleryElement = $('.swiper').find('img')

            const galleryPromises = galleryElement.map((index, element) => {
                return $(element).attr('src')
            }).get()

            const resolvedGallery = await Promise.all(galleryPromises)

            gallery.push(...resolvedGallery)

            return gallery
        }

        const gallery = await getGallery()
        const imageData = gallery[0]

        const getPrice = async function () {

            const prices = []
            const priceElement = $('.international-price')

            const pricePromises = priceElement.map((index, element) => {
                if ($(element).text().includes('€')) {
                    return $(element).text()
                }
            }).get()

            const resolvedPrice = await Promise.all(pricePromises)

            prices.push(...resolvedPrice)

            return prices
        }

        const priceArray = await getPrice()

        if (priceArray.length !== 0) {

            const priceInfo = priceArray[0].replace("Pret de lista", "").split("€")
            let price = null;
            let oldPrice = null;

            if (priceInfo.length === 3) {
                price = priceInfo[1].trim()
                oldPrice = priceInfo[0].trim()
            } else {
                price = priceInfo[0].trim()
            }


            const getDesc = async function () {
                const desc = []
                const descElement = $('#productDescription').find('p')

                const descPromises = descElement.map((index, element) => {
                    return $(element).text()
                }).get()

                const resolvedDesc = await Promise.all(descPromises)

                desc.push(...resolvedDesc)

                return desc
            }

            const bikeDesc = await getDesc()

            const bikeObj = {
                bikeName,
                bikeSlogan: null,
                bikeDesc: bikeDesc[1],
                mainYear,
                priceInfo: {
                    price,
                    oldPrice,
                    currency: "EUR"
                },
                category: null,
                image: imageData,
                gallery,
                info: []
            }



            bikesInfo[tableName][bikeName] = bikeObj

            console.log(`Bike scraped: ${bikeName}`)
        }
    }

    $('.category-product-content').each((index, element) => {
        const bikeName = $(element).find('h2').find('a').text()
        const license = $(element).find('#licenseCategories').text()
        const rabla = $(element).find('.product-colored-badges').find('[style="background-color: #4cde17"]').text()

        if (bikesInfo[tableName][bikeName] !== undefined) {
            bikesInfo[tableName][bikeName].info.push({ label: 'Permis', value: license }, { label: 'Rabla', value: rabla })
        }
    })

    browser.close().then(() => { console.log(`${tableName} scraped`) })
}

const getInfoBeneli = async (url, tableName) => {
    const browser = await puppeteer.launch({ headless: "new" })
    const page = await browser.newPage()

    await page.goto(url, { waitUntil: "networkidle0" })

    const $ = cheerio.load(await page.content())

    bikesInfo[tableName] = {}
    bikesLinks[tableName] = []

    $('.image-holder').find('a').each(async (index, element) => {
        const link = $(element).attr('href');
        bikesLinks[tableName].push(link);
        bikesLinks[tableName] = [...new Set(bikesLinks[tableName])];
    })

    for (const link of bikesLinks[tableName]) {
        if (link !== undefined) {

            await page.goto(link, { waitUntil: "networkidle0" })

            const $ = cheerio.load(await page.content())

            const bikeName = $('h1.title').find('span').text().toLowerCase().trim()
            const getSlogan = function () {
                if ($('._descriptionTab').find('h3').text() !== '') {
                    return $('._descriptionTab').find('h3').text()
                } else {
                    return $('._descriptionTab').find('strong').clone().children().remove().end().text().trim();
                }
            }
            const getDesc = function () {
                if ($('._descriptionTab').find('div').text() !== '') {
                    return $('._descriptionTab').find('div').clone().children().remove().end().text().trim()
                } else {
                    return $('._descriptionTab').find('h3').clone().children().remove().end().text().trim();
                }
            }
            const bikeSlogan = getSlogan()
            const bikeDesc = getDesc()
            const getPrice = function () {
                if ($('.short-description').find('strong').find('span').text() !== '') {
                    let priceElement = $('.short-description').find('strong').find('span').text()
                    return priceElement.split(" ")[0].split(',')[0]
                } else {
                    let priceElement = $('.short-description').find('strong').text()
                    return priceElement.split(" ")[0].split(',')[0]
                }
            }
            const oldPrice = $('.short-description').find('strong').find('s').text().split(" ")[0].split(',')[0]
            const currency = "EUR"
            const imageData = $('#img_0').attr('data-src')

            const price = getPrice()

            const category = $('.breadcrumbs-default').find('a').clone().children().remove().end().text().trim().split("/")[1].toLowerCase().trim()

            const techTable = $('table').find('tr')
            const techArray = []

            techTable.each((index, element) => {
                const techText = $(element).find('td').text().trim()
                if (techText.toLowerCase().includes('capacitate') && techText.toLowerCase().includes('rezervor') === false) {
                    techArray.push({ label: "Capacitate", value: techText.toLowerCase().split('capacitate')[1].replace("cilindrica", "").trim() })
                }
            })

            const getGallery = () => {
                const gallery = []
                const galleryElement = $('.prod-lg-sld').find('a')

                const galleryPromises = galleryElement.map((index, element) => {
                    if ($(element).attr('href').includes('gomagcdn')) {
                        return $(element).attr('href')
                    }
                }).get()

                Promise.all(galleryPromises).then(resolvedGallery => {
                    gallery.push(...resolvedGallery)

                    bikesInfo[tableName][bikeName]['gallery'] = gallery
                })
            }

            const bikeObj = {
                bikeName,
                bikeSlogan,
                bikeDesc,
                mainYear: null,
                priceInfo: {
                    price,
                    oldPrice,
                    currency
                },
                image: imageData,
                category: category,
                info: techArray
            }

            getGallery()

            bikesInfo[tableName][bikeName] = bikeObj

            console.log(`${bikeName} scraped`)
        }
    }

    browser.close().then(() => { console.log(`${tableName} scraped`) })
}

const getInfoBeta = async (url, tableName) => {
    const browser = await puppeteer.launch({ headless: "new" })
    const page = await browser.newPage()

    await page.goto(url, { waitUntil: "networkidle0" })
    const $ = cheerio.load(await page.content())

    bikesInfo[tableName] = {}
    bikesLinks[tableName] = []

    $('a.avia-button').each(async (index, element) => {
        if (url.includes("motard")) {
            if ($(element).attr("href").includes("/moto/") && ($(element).attr("href").includes("rr-motard-125-t") || $(element).attr("href").includes("rr-motard-125-r"))) {
                bikesLinks[tableName].push($(element).attr("href"))
            }
        } else {
            if ($(element).attr("href").includes("/moto/")) {
                bikesLinks[tableName].push($(element).attr("href"))
            }
        }
    })

    for (const link of bikesLinks[tableName]) {
        if (link === undefined) continue

        await page.goto(link, { waitUntil: "networkidle0" })

        const $ = cheerio.load(await page.content())

        const bikeSpec = $("div.features")

        const bikeSpecs = []

        bikeSpec.map(async (index, element) => {
            if ($(element).text().toLowerCase().includes("displacement") || $(element).text().toLowerCase().includes("cilindrata totale")) {
                bikeSpecs.push($(element).text().trim().replace("Displacement\n", "").replace("Cilindrata totale\n", "").replace("cc", "").replace(" ", "").trim())
            }
        });

        for (const spec of bikeSpecs) {
            const finalName = `${$('h3.av-special-heading-tag').first().text().trim()}-(${spec})`
            const bikeName = $('h3.av-special-heading-tag').first().text().trim()
            const bikeDesc = $('div.avia_textblock').find('p').first().text().trim()

            let gallery = []

            const getGallery = async function () {
                const gallery = []
                const galleryElement = $('.ls-link')

                const galleryPromises = galleryElement.map((index, element) => {
                    return $(element).attr('href')
                }).get()

                Promise.all(galleryPromises).then(resolvedGallery => {
                    gallery.push(...resolvedGallery)

                    bikesInfo[tableName][bikeName]['gallery'] = gallery
                })
            }

            getGallery()

            const imageData = gallery[0]

            const yearArray = bikeName.split("MY")
            let mainYear = null
            if (yearArray.length > 1) {
                mainYear = yearArray[1]
            } else {
                mainYear = null
            }

            const category = function () {
                if (bikeName.includes("rr-")) {
                    return "Enduro"
                } else if (bikeName.includes("rx-")) {
                    return "MX"
                } else if (bikeName.includes("alp")) {
                    return "ALP"
                } else if (bikeName.includes("mini")) {
                    return "MiniBike"
                } else {
                    return null
                }
            }

            const bikeObj = {
                bikeName: finalName,
                bikeSlogan: null,
                bikeDesc,
                mainYear,
                priceInfo: {
                    price: null,
                    currency: null,
                    oldPrice: null
                },
                category: category(),
                image: imageData,
                info: [
                    {
                        label: "Capacitate cilindrica",
                        value: `${spec}cc`
                    }
                ]
            }

            bikesInfo[tableName][bikeName] = bikeObj

            console.log(`${bikeName} scraped`)
        }
    }

    browser.close().then(() => { console.log(`${tableName} scraped`) })
}

const getInfoKymco = async function (url, tableName) {
    const browser = await puppeteer.launch({ headless: "new" })
    const page = await browser.newPage()

    await page.goto(url, { waitUntil: "networkidle0" })

    const $ = cheerio.load(await page.content())

    bikesInfo[tableName] = {}
    bikesLinks[tableName] = []

    $('a').each(async (index, element) => {
        const link = $(element).attr('href');
        if (link !== undefined) {
            if (link.includes('/scuter-')) {
                bikesLinks[tableName].push(link);
                bikesLinks[tableName] = [...new Set(bikesLinks[tableName])];
            }
        }
    })

    for (const link of bikesLinks[tableName]) {
        if (link !== undefined) {

            await page.goto(link, { waitUntil: "networkidle0" })

            const $ = cheerio.load(await page.content())

            const bikeName = $('h1.elementor-heading-title').text().trim()
            const bikeDesc = $('.elementor-widget-container').find('p').text().trim().split("(toate taxele incluse)")[1]

            const getMotorInfo = function () {
                const returnInfo = []
                const motorElement = $('.elementor-icon-list-text')
                motorElement.map((index, element) => {
                    if ($(element).text().toLowerCase().includes('(cmc)')) {
                        const valueArray = $(element).text().trim().split(":")
                        const finalValue = valueArray[1].includes('/') === true ? valueArray[1].split('/')[0] : valueArray[1]
                        returnInfo.push({ label: 'Capacitate cilindrica', value: finalValue.trim() })
                    }
                })


                if (returnInfo.length !== 0) {
                    return returnInfo
                }

            }

            let motorInfo = getMotorInfo()
            if (motorInfo === undefined) {
                motorInfo = []
            }

            let bikePrice;
            let oldPrice = null;

            $('span').each((index, element) => {
                if ($(element).text().includes("€")) {
                    bikePrice = $(element).text().trim().replace("€", "").split(".")[0].replace(",", "").trim()
                }
            })

            $('span').each((index, element) => {
                if ($(element).attr('style') === "text-decoration: line-through;") {
                    oldPrice = $(element).text().trim().replace("€", "").split(".")[0].replace(",", "").trim()
                }
            })

            let gallery = []

            const getGallery = async function () {
                const galleryArray = []
                const galleryElement = $('div.modula-items')

                const galleryPromises = galleryElement.map((index, element) => {
                    return $(element).find('img').map((index, element) => {
                        return ($(element).attr('data-full'))
                    }).get()
                }).get()

                Promise.all(galleryPromises).then(resolvedGallery => {
                    galleryArray.push(...resolvedGallery)
                    gallery = galleryArray
                    bikesInfo[tableName][bikeName]['gallery'] = galleryArray
                })
            }

            getGallery()

            const bikeObject = {
                bikeName,
                bikeSlogan: null,
                bikeDesc,
                mainYear: null,
                priceInfo: {
                    price: bikePrice,
                    oldPrice,
                    currency: "EUR"
                },
                image: gallery[0],
                gallery,
                category: null,
                motorInfo
            }

            bikesInfo[tableName][bikeName] = bikeObject

            console.log(`${bikeName} scraped`);
        }
    }

    browser.close().then(() => { console.log(`${tableName} scraped`) })
}

const getInfoPiaggio = async function (url, tableName) {
    const browser = await puppeteer.launch({ headless: "new" })
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: "networkidle0" })

    const $ = cheerio.load(await page.content())

    bikesInfo[tableName] = {}
    bikesLinks[tableName] = []

    let categories = []

    $('.listing__item').each((index, element) => {
        if ($(element).find('a').attr('href').includes("models")) {
            const link = $(element).find('a').attr('href')
            categories.push(link)
        }
    })

    categories = [...new Set(categories)]

    const baseUrl = "https://www.piaggio.com/ro_RO/"
    for (const categoryLink of categories) {
        const finalLink = baseUrl + categoryLink.replace("/ro_RO/", "")
        await page.goto(finalLink, { waitUntil: "networkidle0" })
        const $ = cheerio.load(await page.content())
        $('.card-product').each((index, element) => {
            const link = $(element).attr('href')
            if (link.split("/").length === 6) {
                bikesLinks[tableName].push(link)
            }
        })

    }

    bikesLinks[tableName] = [...new Set(bikesLinks[tableName])]

    const baseURL = "https://www.piaggio.com/ro_RO/"
    for (const link of bikesLinks[tableName]) {
        const finalLink = baseURL + link.replace("/ro_RO/", "")
        await page.goto(finalLink, { waitUntil: "networkidle0" })
        const $ = cheerio.load(await page.content())
        const bikeName = $('.product-presentation__title').text().trim()
        const html = link.split("/")[4]
        const mainYear = html.split("-")[html.split("-").length - 1]
        const getSlogan = async function () {
            const slogan = $('.icon-text__title')

            const sloganText = slogan.map((index, element) => {
                return $(element).text()
            }).get()

            const finalSlogan = await Promise.all(sloganText)

            return finalSlogan.join(" ")
        }
        const bikeSlogan = await getSlogan()
        const bikeDesc = $('.editorial-icon__text').find('p').text().trim()
        const price = $('.product-price__list').text().trim().split(" ")[1]

        const getImage = async () => {
            const image = $('.image')

            const imageSrc = image.map((index, element) => {
                const src = $(element).attr('src')
                if (src !== undefined && src.includes("vehicles")) {
                    return src
                }
            }).get()

            const imageData = await Promise.all(imageSrc)

            return imageData[0]
        }

        const imageData = await getImage()

        const category = link.split("/")[3]

        const bikeObj = {
            bikeName,
            bikeSlogan,
            bikeDesc,
            mainYear,
            priceInfo: {
                price,
                oldPrice: null,
                currency: "EUR"
            },
            image: imageData,
            gallery: [],
            category: category,
            info: []
        }

        bikesInfo[tableName][bikeName] = bikeObj

        console.log(`${bikeName} scraped`);
    }

    browser.close().then(() => console.log(`${tableName} scraped`))
}

const getInfoPolaris = async function (url, tableName) {
    const browser = await puppeteer.launch({ headless: "new" })
    const page = await browser.newPage()

    await page.goto(url, { waitUntil: "networkidle0", timeout: 0 })

    const $ = cheerio.load(await page.content())

    bikesInfo[tableName] = {}
    bikesLinks[tableName] = []

    const categories = []
    const result = {}

    $('div.az-element.az-text:has(p):has(b)').each((index, element) => {
        const category = $(element).text()
        categories.push(category)
        result[category] = []
        $(element).nextUntil('div.az-element.az-text:has(p):has(b)').each((index, element) => {
            const link = $(element).find('div.az-element.az-ctnr.az-column').find('.az-element.az-image')
            link.each((index, element) => {
                const link = $(element).find('a').attr('href')
                result[category].push(link)
            })
        })
    })

    const categoryName = url.split("/")[3]

    bikesLinks[tableName].push({ [categoryName]: result })

    for (const overall of bikesLinks[tableName]) {
        for (const overallIndex in overall) {
            const section = overall[overallIndex]
            for (const sectionIndex in section) {
                const category = section[sectionIndex]
                for (const link of category) {
                    if (link !== undefined) {


                        await page.goto(link, { waitUntil: "networkidle0", timeout: 0 })

                        const $ = cheerio.load(await page.content())

                        const bikeName = `${link.split("/")[3]}-${link.split("/")[4]}`

                        let motorInfo = null
                        if ($('.a1').text().includes("CC")) {
                            motorInfo = $('.a1').text().replace("MOTOR").split("CC")[0].trim().replace('10+ANI', "")
                        }

                        if (overallIndex.includes('snowmobile')) {
                            motorInfo = $('table.table-bordered').find('td').text().split("Capacitate cilindrica")[1].split('cc')[0].split("-")[1].trim()
                        }

                        const getPrice = async function () {
                            const array = []
                            const element = $('.az-element.az-text').find('h4, h3')

                            const elementPromises = element.map((index, element) => {
                                if ($(element).text().includes("€")) {
                                    return $(element).text()
                                }
                            }).get()

                            const resolvedElement = await Promise.all(elementPromises)

                            array.push(resolvedElement)

                            return array
                        }

                        const priceInfo = await getPrice()

                        let price = null
                        let oldPrice = null

                        if (priceInfo[0].length == 2) {
                            price = priceInfo[0][1].replace("TVA", "").replace("+", "").replace("€", "")
                            oldPrice = priceInfo[0][0].replace("TVA", "").replace("+", "").replace("€", "")
                        } else {
                            price = priceInfo[0][0].replace("TVA", "").replace("+", "").replace("€", "")
                        }

                        const imageData = $('.owl-item').first().find('img').attr('src')

                        const getGallery = async function () {
                            const gallery = []
                            const bikeImageElements = $('.owl-item').find('img')

                            const imageDataPromises = bikeImageElements.map((index, element) => {
                                return $(element).attr('src')
                            }).get()

                            const imageData = await Promise.all(imageDataPromises)

                            gallery.push(...imageData)

                            return gallery
                        }

                        const gallery = await getGallery()

                        const bikeObj = {
                            bikeName,
                            bikeSlogan: "",
                            bikeDesc: "",
                            mainYear: null,
                            priceInfo: {
                                price,
                                oldPrice,
                                currency: "EUR"
                            },
                            category: sectionIndex,
                            image: imageData,
                            gallery,
                            info: [
                                {
                                    label: "Capacitate cilindrica",
                                    value: `${motorInfo}cc`
                                }
                            ]
                        }

                        bikesInfo[tableName][bikeName] = bikeObj

                        console.log(`${bikeName} scraped`)
                    }
                }
            }
        }
    }

    browser.close().then(() => { console.log(`${tableName} scraped`) })
}

const getInfoSegway = async function (url, tableName) {
    const browser = await puppeteer.launch({ headless: "new" })
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: "networkidle0" })

    const $ = cheerio.load(await page.content())

    bikesInfo[tableName] = {}
    bikesLinks[tableName] = []
    $('.vehicle-image-wrapper').find('a').each((i, el) => {
        const link = $(el).attr('href')
        bikesLinks[tableName].push(link)
        bikesLinks[tableName] = [...new Set(bikesLinks[tableName])]
    })

    const baseURL = "https://segwaypowersports.ro"
    for (const link of bikesLinks[tableName]) {

        const finalLink = baseURL + link

        await page.goto(finalLink, { waitUntil: "networkidle0" })

        const $ = cheerio.load(await page.content())

        const bikeName = link.split("/")[1]

        const getSlogan = async function () {
            const sloganArray = []
            const slogan = $('.module-text').find('h3')

            const sloganPromises = slogan.map((index, element) => {
                return $(element).text()
            }).get()

            const resolvedSlogan = await Promise.all(sloganPromises)

            sloganArray.push(resolvedSlogan)

            return sloganArray
        }

        const bikeSloganInfo = await getSlogan()
        const bikeSlogan = bikeSloganInfo[0][0]


        const getDesc = async function () {
            const desc = []
            const element = $('.order2').find('p')

            const elementPromises = element.map((index, element) => {
                return $(element).text()
            }).get()

            const resolvedElement = await Promise.all(elementPromises)

            desc.push(resolvedElement)

            return desc
        }

        const bikeDesc = await getDesc()

        const imageData = `https://segwaypowersports.ro${$('#slick-slide00').attr("style").replace("background-image", "").replace(":", "").replace("url", "").split(";")[0].replace(/\"/g, "").replace(/[\(\)]+/g, "").trim()}`
        const priceInfoElement = $('.price-wrapper').text().split("De la")

        let oldPrice = null
        let priceInfo = null

        if (priceInfoElement.length === 3) {
            priceInfo = [priceInfoElement[1].replace("(TVA inclus)\n\nOmologare", "").split("€")[0].trim(), priceInfoElement[2].replace("(TVA inclus)\n\nOmologare", "").split("€")[0].trim()]

            const oldPriceArray = priceInfoElement[1].replace("(TVA inclus)\n\nOmologare", "").split("€")

            if (oldPriceArray.length === 3) {
                oldPrice = oldPriceArray[0].trim()
                priceInfo = [oldPriceArray[1].trim(), priceInfoElement[2].replace("(TVA inclus)\n\nOmologare", "").split("€")[0].trim()]
            }
        } else {
            priceInfo = priceInfoElement[1] !== undefined ? priceInfoElement[1].replace("(TVA inclus)\n\nOmologare", "").split("€")[0].trim() : priceInfoElement[0].replace("(TVA inclus)\n\nOmologare", "").split("€")[0].trim()

            const oldPriceArray = priceInfoElement[1] !== undefined ? priceInfoElement[1].replace("(TVA inclus)\n\nOmologare", "").split("€") : priceInfoElement[0].replace("(TVA inclus)\n\nOmologare", "").split("€")

            if (oldPriceArray.length === 3) {
                oldPrice = oldPriceArray[0].trim()
                priceInfo = oldPriceArray[1].trim()
            }
        }


        const getInfo = async function () {
            const info = []
            const element = $('tr')
            const infoPromises = element.map((index, element) => {
                if ($(element).text().includes("Tip motor")) {
                    return $(element).text()
                }
            }).get()

            const resolvedInfo = await Promise.all(infoPromises)

            info.push(resolvedInfo)

            return info
        }

        const motorInfoElement = await getInfo()

        const motorInfo = (motorInfoElement[0][0].split(",")[0].replace(/\D/g, ""))

        const getGallery = async function () {
            const gallery = []
            const galleryElement = $('figure').find('a')

            const galleryPromises = galleryElement.map((index, element) => {
                return `$https://segwaypowersports.ro/${$(element).attr('href')}`
            }).get()

            const resolvedGallery = await Promise.all(galleryPromises)

            gallery.push(...resolvedGallery)

            return gallery
        }

        const gallery = await getGallery()

        if (priceInfo.includes("În curând")) {
            priceInfo = null
        }

        const bikeObj = {
            bikeName,
            bikeSlogan,
            bikeDesc: bikeDesc[0][0],
            mainYear: null,
            priceInfo: {
                price: priceInfo,
                oldPrice,
                currency: "EUR"
            },
            category: null,
            image: imageData,
            gallery,
            info: [
                {
                    label: "Capacitate cilindrica",
                    value: `${motorInfo}cc`
                }
            ]
        }

        bikesInfo[tableName][bikeName] = bikeObj

        console.log(`${bikeName} scraped`)
    }

    browser.close().then(() => console.log(`${tableName} scraped`))
}

const getInfoSuzuki = async function (url, type, tableName) {
    const browser = await puppeteer.launch({ headless: "new" })
    const page = await browser.newPage()

    await page.goto(url, { waitUntil: "networkidle0" })

    const $ = cheerio.load(await page.content())

    bikesInfo[tableName] = {}
    bikesLinks[tableName] = []

    $('.owl-item').each((index, element) => {
        const link = $(element).find('a').attr('href')
        bikesLinks[tableName].push(link)
    })

    bikesLinks[tableName] = [...new Set(bikesLinks[tableName])]

    const baseURL = "https://bikes.suzuki.ro"
    for (const link of bikesLinks[tableName]) {
        const finalLink = `${baseURL}${link}`
        await page.goto(finalLink, { waitUntil: "networkidle0" })

        const $ = cheerio.load(await page.content())

        // Retrieve the bike name element
        // const bikeNameElement = $('#BIKE_NAME');
        // Extract the text from the bike name element and perform some filtering
        // const bikeName = $(bikeNameElement).text().replace("Următorul", "")

        const bikeName = link.split("/")[2]
        // Retrieve the bike image element
        const bikeImageElement = $('.intro-section-main-bike-container__main-bike-image');
        const imageData = bikeImageElement.attr('src');

        /**
        * Retrieves the bike slogan and description from the DOM.
        *
        * @returns {Promise<{bikeSlogan: string, bikeDesc: string}>} An object containing the bike slogan and description.
        */
        const getBikeDescription = async () => {
            const bikeSlogan = $('.intro-section-main-bike-container__bike-slogan').text();
            const bikeDesc = $('.intro-section-main-bike-container__bike-introduction > p').text().replace(/\s+/g, ' ').trim();

            return {
                bikeSlogan,
                bikeDesc
            };
        };



        const mainYear = await $('.year-block-main-year ').text()

        const getGallery = async () => {
            const gallery = [];

            // Get the collection of bike image elements
            const bikeImageElements = $('.bike-main-slider-navigation__indicator-image.bms-img');

            // Use `map` to create an array of promises that fetch the image data
            const imageDataPromises = bikeImageElements.map((index, element) => {
                const imageSrc = $(element).attr('src');
                return imageSrc
            }).get(); // Use `.get()` to retrieve the actual array of promises

            // Wait for all the promises to resolve using `Promise.all`
            const imageData = await Promise.all(imageDataPromises);

            // Add the image data to the gallery array
            gallery.push(...imageData);

            return gallery;
        };

        const { bikeSlogan, bikeDesc } = await getBikeDescription();
        const gallery = await getGallery();

        const getPrices = () => {
            const currency = [... new Set($('span.price-block-value').text().replace(/\d+\s+/g, ""))].join("")
            if ($('span.price-block-value').text() !== "") {
                const priceArray = $('span.price-block-value').text().split(currency)
                const price = parseInt(priceArray[0].replace(" ", ""))
                let oldPrice = null;
                if (priceArray.length === 3) {
                    oldPrice = parseInt(priceArray[1].replace(" ", ""))
                }
                return {
                    price,
                    currency,
                    oldPrice
                }
            } else {
                return {
                    price: null,
                    currency: null,
                    oldPrice: null
                }
            }
        }

        const { price, currency, oldPrice } = getPrices()

        const bikeObj = {
            bikeName,
            bikeSlogan,
            bikeDesc,
            mainYear,
            priceInfo: {
                price,
                currency,
                oldPrice
            },
            image: imageData,
            gallery
        }

        bikesInfo[tableName][bikeName] = bikeObj

        console.log(`${bikeName} scraped`)
    }

    browser.close().then(() => console.log(`${tableName} scraped`))
}

const getInfoSwm = async function (url, tableName) {
    const browser = await puppeteer.launch({ headless: "new" })
    const page = await browser.newPage()

    await page.goto(url, { waitUntil: "networkidle0" })

    bikesLinks[tableName] = []
    bikesInfo[tableName] = {}

    const $ = cheerio.load(await page.content())

    const getLinks = async function () {
        const slideElement = $('.wpcp-slide-image')

        const links = []
        const slidePromise = slideElement.map(async (index, element) => {
            const link = $(element).find('a').attr('href')
            if (link.includes('/swm-moto/')) {
                return link
            }
        }).get()

        const resolvedSlide = await Promise.all(slidePromise)


        links.push(...resolvedSlide)

        return links
    }

    bikesLinks[tableName] = await getLinks()

    for (const link of bikesLinks[tableName]) {
        if (link === undefined) continue

        await page.goto(link, { waitUntil: "networkidle0" })

        const $ = cheerio.load(await page.content())

        const category = $('h3.vc_custom_heading').text().trim()
        const bikeName = link.split("/")[4]

        const getBikeDesc = async function () {
            const descElement = $('p')

            const descPromise = descElement.map((index, element) => {
                if ($(element).attr('style') === 'color: white;') {
                    return ($(element).text())
                }
            }).get()

            const resolvedDesc = await Promise.all(descPromise)

            return resolvedDesc
        }

        const bikeDesc = await getBikeDesc()

        const getGallery = async function () {
            const gallery = []
            const galleryElement = $('.vc_gitem-zone-img')

            const galleryPromises = galleryElement.map((index, element) => {
                return $(element).attr('src')
            }).get()

            const resolvedGallery = await Promise.all(galleryPromises)

            gallery.push(...resolvedGallery)

            return gallery
        }

        const getImageData = async function () {
            const gallery = []
            const galleryElement = $('.stm_carousel__single').find('img')

            const galleryPromises = galleryElement.map((index, element) => {
                return $(element).attr('src')
            }).get()

            const resolvedGallery = await Promise.all(galleryPromises)

            gallery.push(...resolvedGallery)

            return gallery
        }

        const gallery = await getGallery()

        const getMotorInfo = async function () {
            const motorInfo = []
            const motorElement = $('p')

            const motorPromises = motorElement.map((index, element) => {
                if ((/[\d,\s]+cc/g).test($(element).text())) {
                    const elementArray = $(element).text().split(" ");
                    const finalValue = elementArray.find(element => element.includes('cc'))
                    if (bikeName === "sidecar-520-white") {
                        return `${elementArray[3]}cc`
                    } else {
                        return finalValue
                    }
                }
            }).get()

            const resolvedMotor = await Promise.all(motorPromises)

            motorInfo.push(...resolvedMotor)

            return motorInfo
        }

        const imageData = await getImageData()
        const motorInfo = await getMotorInfo()

        const bikeObj = {
            bikeName,
            bikeSlogan: null,
            mainYear: null,
            bikeDesc: bikeDesc.join(""),
            priceInfo: {
                price: null,
                currency: null,
                oldPrice: null
            },
            image: imageData[0],
            category,
            gallery,
            info: [
                {
                    label: "Capacitate cilindrica",
                    value: motorInfo[0]
                }
            ]
        }

        bikesInfo[tableName][bikeName] = bikeObj

        console.log(`${bikeName} scraped`)
    }

    browser.close().then(() => console.log(`${tableName} scraped`))
}

const getInfoSym = async function (url, tableName) {
    const browser = await puppeteer.launch({ headless: "new" })
    const page = await browser.newPage()

    await page.goto(url, { waitUntil: "networkidle0" })

    const $ = cheerio.load(await page.content())

    bikesLinks[tableName] = []
    bikesInfo[tableName] = {}

    $('a.product-image-link').each(async (index, element) => {
        bikesLinks[tableName].push($(element).attr('href'))
    })

    bikesLinks[tableName] = [...new Set(bikesLinks[tableName])]

    for (const link of bikesLinks[tableName]) {
        await page.goto(link, { waitUntil: "networkidle0" })
        const htmlName = link.split("/")[4]

        const $ = cheerio.load(await page.content())

        $('.wd-products-tabs').remove()

        const bikeNameArray = $('h1.product_title').text().split(" – ")
        const bikeName = bikeNameArray[0].trim()
        let bikeSlogan = ""
        if (bikeNameArray.length > 1) {
            bikeSlogan = bikeNameArray[1].trim()
        }

        const bikeDesc = $('.woocommerce-product-details__short-description').text().trim()
        const imageData = $('.wp-post-image').attr('src')
        const bikeCategory = htmlName.replace("scuter-", "").replace("scooter-", "").replace("sym-", "").split("-")[0]

        const bikePriceArray = $('bdi').text().split("€")

        bikePriceArray.pop()

        for (let i = 0; i <= bikePriceArray.length; i++) {

            const motorInfo = $(`th.ninja_column_${i + 1}`).text().trim()

            if (motorInfo !== undefined) {

                let nameInfo = ''
                if (motorInfo.includes("cc")) {
                    nameInfo = motorInfo.replace("cc", "")
                } else {
                    nameInfo = motorInfo
                }

                const finalBikeName = bikeName + " " + nameInfo

                if (motorInfo.split("")[0] !== undefined) {
                    const bikeObj = {
                        bikeName: finalBikeName,
                        bikeSlogan,
                        bikeDesc,
                        mainYear: null,
                        priceInfo: {
                            price: bikePriceArray[i].replace(" ", "").replace(",", ""),
                            oldPrice: null,
                            currency: "EUR"
                        },
                        image: imageData,
                        gallery: [],
                        category: bikeCategory,
                        info: [
                            {
                                label: "Capacitate cilindrica",
                                value: motorInfo
                            }
                        ]
                    }

                    bikesInfo[tableName][finalBikeName] = bikeObj

                    console.log(`${bikeName} scraped`)
                }
            }
        }
    }

    browser.close().then(() => console.log(`${tableName} scraped`))
}

const getInfoVespa = async function (url, tableName) {
    const browser = await puppeteer.launch({ headless: "new" })
    const page = await browser.newPage()

    await page.goto(url, { waitUntil: "networkidle0" })

    const dataHtml = cheerio.load(await page.content())

    bikesInfo[tableName] = {}
    bikesLinks[tableName] = []

    dataHtml('.listing__item').each((index, element) => {
        if (dataHtml(element).find('a').attr('href').includes("models")) {
            const link = dataHtml(element).find('a').attr('href')
            bikesLinks[tableName].push(link)
        }
    })

    bikesLinks[tableName] = [...new Set(bikesLinks[tableName])]

    let categoryLinks = []

    const baseUrl = "https://www.vespa.com"
    for (const link of bikesLinks[tableName]) {
        await page.goto(baseUrl + link, { waitUntil: "networkidle0" })

        const $ = cheerio.load(await page.content())

        $('.listing__item').each(async (index, element) => {
            if ($(element).find('a').attr('href').includes("models")) {
                const link = $(element).find('a').attr('href')
                categoryLinks.push(link)
            }
        })
    }

    categoryLinks = [...new Set(categoryLinks)]

    for (const link of categoryLinks) {
        if (link.split("/").length === 6) {
            await page.goto(baseUrl + link, { waitUntil: "networkidle0" })

            const $ = cheerio.load(await page.content())

            const html = link.split("/")[4]
            const bikeName = $('.product-presentation__title').text().trim()
            const mainYear = html.split("-")[html.split("-").length - 1]
            const bikeDesc = $('.product-presentation__abstract').text().trim()
            const price = $('.product-price__list').text().trim().split(" ")[1]

            const getImage = async () => {
                const image = $('.image')

                const imageSrc = image.map((index, element) => {
                    const src = $(element).attr('src')
                    if (src !== undefined && src.includes("vehicles")) {
                        return src
                    }
                }).get()

                const imageData = await Promise.all(imageSrc)

                return imageData[0]
            }

            const imageData = await getImage()

            const category = link.split("/")[3]

            const bikeObj = {
                bikeName,
                bikeSlogan: null,
                bikeDesc,
                mainYear,
                priceInfo: {
                    price,
                    oldPrice: null,
                    currency: "EUR"
                },
                image: imageData,
                gallery: [],
                category: category,
                info: []
            }

            bikesInfo[tableName][bikeName] = bikeObj

            console.log(`${bikeName} scraped`)
        }
    }
    browser.close().then(() => console.log(`${tableName} scraped`))
}

const getInfoYamaha = async function (url, tableName) {
    const browser = await puppeteer.launch({ headless: "new" })
    const page = await browser.newPage()

    await page.goto(url, { waitUntil: "networkidle0" })

    const $ = cheerio.load(await page.content())

    bikesLinks[tableName] = []
    bikesInfo[tableName] = {}

    $('a.fmYybM').each(async (index, element) => {
        const link = $(element).attr('href');
        bikesLinks[tableName].push(link);

        if (link.includes("404") === false) {
            const bikeStringArray = $(element).attr('href').split('/')
            const bikeName = `yamaha ${bikeStringArray[6].split('-').slice(0, -1).join('-')}`;
            const category = bikeStringArray[4];
            const bikeYear = bikeStringArray[6].split('-').pop();

            const bikePriceArray = $(element).find('p.kHtpLg').text().trim().split(',');
            const getPrice = () => {
                if (bikePriceArray.length === 2) {
                    return { price: parseInt(bikePriceArray[0].replace('.', '')), currency: (bikePriceArray[1].replace(/\d+\s/g, '')) }
                } else {
                    return {
                        price: "null",
                        currency: "null"
                    }
                }
            }

            const { price, currency } = getPrice()

            const bikeImageElement = $(element).find('.liNnyA').attr('src')

            const bikeObj = {
                bikeName,
                bikeSlogan: [],
                bikeDesc: [],
                mainYear: bikeYear,
                priceInfo: {
                    price,
                    currency,
                    oldPrice: null
                },
                image: bikeImageElement,
                gallery: []
            }

            bikesInfo[tableName][bikeName] = bikeObj
            bikesInfo[tableName][bikeName]["category"] = category
        }
    });

    bikesLinks[tableName] = [...new Set(bikesLinks[tableName])]

    const baseURL = "https://www.yamaha-motor.eu"
    for (const link of bikesLinks[tableName]) {
        if (link.includes("404")) continue
        await page.goto(baseURL + link, { waitUntil: "networkidle0" })

        const $ = cheerio.load(await page.content())

        const bikeSlogan = $('.jNUtxF').text()
        const bikeDesc = function () {
            if ($('.hpWEtG').text() === "") {
                let description = ""
                $('.drvHtK').each((index, element) => {
                    description += `${$(element).text()} | `
                })
                return description
            } else {
                return $('.hpWEtG').text()
            }
        }
        const bikeId = `yamaha ${link.split("/")[6].split('-').slice(0, -1).join('-')}`

        const techs = $('.khEXeL');
        const techArray = []

        techs.each((index, element) => {
            const tech = $(element).text();
            if (tech.toLowerCase().includes('capacitate')) {
                techArray.push({ label: 'Capacitate', value: tech.toLowerCase().split('cilindrică')[1] })
            }
        })

        const getGallery = async () => {
            const gallery = []
            const bikeImageElements = $('img')

            const imageDataPromises = bikeImageElements.map((index, element) => {
                if ($(element).attr('src').includes('product-assets')) {
                    return $(element).attr('src')
                }
            }).get();

            const imageData = await Promise.all(imageDataPromises);

            gallery.push(...imageData)

            return gallery
        }

        const gallery = await getGallery()

        bikesInfo[tableName][bikeId].bikeSlogan = bikeSlogan
        bikesInfo[tableName][bikeId].bikeDesc = bikeDesc()
        bikesInfo[tableName][bikeId]["info"] = techArray
        bikesInfo[tableName][bikeId]["gallery"] = gallery

        console.log(`${bikeId} scraped`)

    }

    browser.close().then(() => console.log(`${tableName} scraped`))
}

const motoBoomBikes = [
    {
        url: 'https://www.motoboom.ro/moto-Aprilia?limit=100',
        type: 'motocicleta',
        tableName: 'aprilia',
        categoryUrl: null
    },
    {
        url: 'https://www.motoboom.ro/triumph?limit=100',
        type: 'motocicleta',
        tableName: 'triumph',
        categoryUrl: null
    },
    {
        url: 'https://www.motoboom.ro/Moto-Kawasaki?limit=100',
        type: 'motocicleta',
        tableName: 'kawasaki',
        categoryUrl: 'https://www.kawasaki.eu/en/Motorcycles.html'
    },
    {
        url: 'https://www.motoboom.ro/can-am?limit=100',
        type: 'atv',
        tableName: 'canam',
        categoryUrl: null
    }
]

const aspgroupBikes = [
    {
        url: 'https://www.aspgroup.ro/tgb',
        type: 'atv',
        tableName: 'aspgroup',
    },
    {
        url: 'https://www.aspgroup.ro/linhai',
        type: 'atv',
        tableName: 'aspgroup',
    },
    {
        url: 'https://www.aspgroup.ro/argo',
        type: 'atv',
        tableName: 'aspgroup',
    },
]

const atvromBikes = [
    {
        url: 'https://www.atvrom.ro/motociclete/ktm/page/1',
        type: 'motocicleta',
        tableName: 'ktm',
    },
    {
        url: 'https://www.atvrom.ro/motociclete/ktm/page/2',
        type: 'motocicleta',
        tableName: 'ktm',
    },
    {
        url: 'https://www.atvrom.ro/motociclete/ktm/page/3',
        type: 'motocicleta',
        tableName: 'ktm',
    },
    {
        url: 'https://www.atvrom.ro/motociclete/ktm/page/4',
        type: 'motocicleta',
        tableName: 'ktm',
    },
    {
        url: 'https://www.atvrom.ro/motociclete/ktm/page/5',
        type: 'motocicleta',
        tableName: 'ktm',
    },
    {
        url: 'https://www.atvrom.ro/motociclete/husqvarna/page/1',
        type: 'motocicleta',
        tableName: 'husqvarna',
    },
    {
        url: 'https://www.atvrom.ro/motociclete/husqvarna/page/2',
        type: 'motocicleta',
        tableName: 'husqvarna',
    },
    {
        url: 'https://www.atvrom.ro/motociclete/husqvarna/page/3',
        type: 'motocicleta',
        tableName: 'husqvarna',
    },
    {
        url: 'https://www.atvrom.ro/motociclete/husqvarna/page/4',
        type: 'motocicleta',
        tableName: 'husqvarna',
    },
    {
        url: 'https://www.atvrom.ro/motociclete/gasgas/page/1',
        type: 'motocicleta',
        tableName: 'gasgas',
    },
    {
        url: 'https://www.atvrom.ro/motociclete/gasgas/page/2',
        type: 'motocicleta',
        tableName: 'gasgas',
    },
    {
        url: 'https://www.atvrom.ro/motociclete/gasgas/page/3',
        type: 'motocicleta',
        tableName: 'gasgas',
    },
    {
        url: 'https://www.atvrom.ro/motociclete/gasgas/page/4',
        type: 'motocicleta',
        tableName: 'gasgas',
    }
]

const beneliBikes = [
    {
        url: 'https://www.benelli-moto.ro/touring',
        type: 'motocicleta',
        tableName: 'beneli',
    },
    {
        url: 'https://www.benelli-moto.ro/leoncino',
        type: 'motocicleta',
        tableName: 'beneli',
    },
    {
        url: 'https://www.benelli-moto.ro/naked',
        type: 'motocicleta',
        tableName: 'beneli',
    },
    {
        url: 'https://www.benelli-moto.ro/clasic',
        type: 'motocicleta',
        tableName: 'beneli',
    }
]

const betaBikes = [
    {
        url: 'https://www.betamotor.com/en/enduro',
        type: 'motocicleta',
        tableName: 'beta',
    },
    {
        url: 'https://www.betamotor.com/en/mx',
        type: 'motocicleta',
        tableName: 'beta',
    },
    {
        url: 'https://www.betamotor.com/en/alp',
        type: 'motocicleta',
        tableName: 'beta',
    },
    {
        url: 'https://www.betamotor.com/en/minibike',
        type: 'motocicleta',
        tableName: 'beta',
    },
    {
        url: 'https://www.betamotor.com/en/motard',
        type: 'motocicleta',
        tableName: 'beta',
    }
]

const kymcoBikes = [
    {
        url: 'https://www.kymco.ro/scutere/',
        type: 'scuter',
        tableName: 'kymco',
    }
]

const piaggioBikes = [
    {
        url: 'https://www.piaggio.com/ro_RO/',
        type: 'scuter',
        tableName: 'piaggio',
    }
]

const polarisBikes = [
    {
        url: 'https://polarisofficial.ro/atv',
        type: 'atv',
        tableName: 'polaris',
    },
    {
        url: 'https://polarisofficial.ro/rzr',
        type: 'atv',
        tableName: 'polaris',
    },
    {
        url: 'https://polarisofficial.ro/ranger',
        type: 'atv',
        tableName: 'polaris',
    },
    {
        url: 'https://polarisofficial.ro/general',
        type: 'atv',
        tableName: 'polaris',
    }
]

const polarisSnowmobiles = [
    {
        url: 'https://polarisofficial.ro/snowmobile',
        type: 'snowmobile',
        tableName: 'polaris',
    }
]

const segwayBikes = [
    {
        url: 'https://segwaypowersports.ro/atv',
        type: 'atv',
        tableName: 'segway',
    },
    {
        url: 'https://segwaypowersports.ro/utv',
        type: 'atv',
        tableName: 'segway',
    },
    {
        url: 'https://segwaypowersports.ro/ssv',
        type: 'atv',
        tableName: 'segway',
    }
]

const suzukiBikes = [
    {
        url: 'https://bikes.suzuki.ro/motociclete',
        type: 'motocicleta',
        tableName: 'suzuki',
    },
    {
        url: 'https://bikes.suzuki.ro/scutere',
        type: 'scuter',
        tableName: 'suzuki',
    }

]

const swmBikes = [
    {
        url: 'https://swm-motorcycles.it/',
        type: 'motocicleta',
        tableName: 'swm',
    }
]

const symBikes = [
    {
        url: 'https://sym-romania.ro/motociclete/',
        type: 'motocicleta',
        tableName: 'sym',
    },
    {
        url: 'https://sym-romania.ro/scutere/',
        type: 'scuter',
        tableName: 'sym',
    }
]

const vespaBikes = [
    {
        url: 'https://www.vespa.com/ro_RO/',
        type: 'scuter',
        tableName: 'vespa',
    }
]

const yamahaBikes = [
    {
        url: "https://www.yamaha-motor.eu/ro/ro/motorcycles/?page=1&perPage=24",
        type: 'motocicleta',
        tableName: 'yamaha',
    },
    {
        url: "https://www.yamaha-motor.eu/ro/ro/motorcycles/?page=2&perPage=24",
        type: 'motocicleta',
        tableName: 'yamaha',
    },
    {
        url: 'https://www.yamaha-motor.eu/ro/ro/scooters/?page=1&perPage=24',
        type: 'scuter',
        tableName: 'yamaha',
    },
    {
        url: 'https://www.yamaha-motor.eu/ro/ro/atv-side-by-side/?page=1&perPage=24',
        type: 'atv',
        tableName: 'yamaha',
    },
    {
        url: 'https://www.yamaha-motor.eu/ro/ro/atv-side-by-side/?page=2&perPage=24',
        type: 'atv',
        tableName: 'yamaha',
    },
    {
        url: 'https://www.yamaha-motor.eu/ro/ro/snowmobile/?page=1&perPage=24',
        type: 'snowmobile',
        tableName: 'yamaha',
    }
]

const dbQuery = async (bikesInfo, type, tableName, connection) => {
    const tableTypes = {
        'motocicleta': 'bikes',
        'scuter': 'scooters',
        'atv': 'atv',
        'snowmobile': 'snowmobiles'
    }

    const getTableType = (type) => tableTypes[type] || 'bikes';

    const tableType = getTableType(type)

    const tableExists = async (tableName) => {
        const result = await connection.query(`SELECT * FROM information_schema.tables WHERE table_name = '${tableName}'`)
        return result.length > 0
    }

    const tableQuery = {
        text: '',
    }

    if (await tableExists(tableName) === false) {

        tableQuery.text = `CREATE TABLE IF NOT EXISTS public.${tableName}_${tableType} (
                id text,
                bike_name VARCHAR(255) UNIQUE,
                bike_slogan text,
                bike_description text,
                main_year text,
                price text,
                old_price text,
                currency text,
                image text,
                gallery text,
                category text,
                rabla text,
                permis text,
                capacitate text,
                is_gallery boolean,
                gallery_image text,
                gallery_title text,
                gallery_description text,
                is_popular boolean,
                brand text,
                vehicle_type text
            )`

        try {
            await connection.query(tableQuery)
            console.log(`Created table: ${tableName}`)
        } catch (error) {
            console.error(error)
        }
    }

    const infoQuery = {
        text: ``,
        values: []
    }

    const moveInfoToObject = function (data) {
        if (data.info && data.info.length > 0) {
            const infoObject = {};
            data.info.forEach(item => {
                if (item.label == "Capacitate cilindrică" || item.label == "Capacitate cilindrica") {
                    item.label = "capacitate"
                } else {
                    item.label = item.label.toLowerCase()
                }
                infoObject[item.label] = item.value;
            });
            const { info, ...rest } = data;
            return {
                ...rest,
                ...infoObject
            };
        } else {
            return data;
        }
    }

    const addKeysToObject = function (obj) {
        if (!obj.hasOwnProperty('capacitate')) {
            obj.capacitate = null;
        }
        if (!obj.hasOwnProperty('rabla')) {
            obj.rabla = null;
        }
        if (!obj.hasOwnProperty('permis')) {
            obj.permis = null;
        }
        return obj;
    }

    for (const index in bikesInfo) {
        if (index !== '') {
            infoQuery.values = []
            let bike = moveInfoToObject(bikesInfo[index])
            bike = addKeysToObject(bike)

            infoQuery.values.push(uuidv4())
            infoQuery.values.push(bike.bikeName)
            infoQuery.values.push(bike.bikeSlogan)
            infoQuery.values.push(bike.bikeDesc)
            infoQuery.values.push(bike.mainYear)
            if (bike.priceInfo.price === undefined) {
                infoQuery.values.push(bike.priceInfo.price[0])
            } else {
                infoQuery.values.push(bike.priceInfo.price)
            }
            infoQuery.values.push(bike.priceInfo.oldPrice)
            infoQuery.values.push(bike.priceInfo.currency)
            infoQuery.values.push(bike.image)
            infoQuery.values.push(bike.gallery)
            infoQuery.values.push(bike.category)
            infoQuery.values.push(bike.rabla)
            infoQuery.values.push(bike.permis)
            infoQuery.values.push(bike.capacitate)
            infoQuery.values.push(false)
            infoQuery.values.push("no image")
            infoQuery.values.push(bike.bikeName)
            infoQuery.values.push("no description")
            infoQuery.values.push(false)
            infoQuery.values.push(tableName)
            infoQuery.values.push(tableType)

            infoQuery.text = `INSERT INTO public.${tableName}_${tableType} 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) 
            ON CONFLICT (bike_name) DO UPDATE 
            SET price = COALESCE(EXCLUDED.price, public.${tableName}_${tableType}.price), 
                old_price = COALESCE(EXCLUDED.old_price, public.${tableName}_${tableType}.old_price),
                image = COALESCE(EXCLUDED.image, public.${tableName}_${tableType}.image), 
                gallery = COALESCE(EXCLUDED.gallery, public.${tableName}_${tableType}.gallery)`

            try {
                await connection.query(infoQuery)
            } catch (error) {
                console.log(error)
                return
            }
        }
    }
}

const processMotoBoomBike = async (array, getInfo, connection) => {
    for (const bike of array) {
        const { url, type, tableName, categoryUrl } = bike
        await getInfo(url, type, tableName, categoryUrl)
        await dbQuery(bikesInfo[tableName], type, tableName, connection)
    }
}

const processBike = async (array, getInfo, connection) => {
    for (const bike of array) {
        const { url, type, tableName } = bike
        await getInfo(url, tableName)
        await dbQuery(bikesInfo[tableName], type, tableName, connection)
    }
}

const processSuzuki = async (array, getInfo, connection) => {
    for (const bike of array) {
        const { url, type, tableName } = bike
        await getInfo(url, type, tableName)
        await dbQuery(bikesInfo[tableName], type, tableName, connection)
    }
}


const init = async (connection) => {
    try {
        await processMotoBoomBike(motoBoomBikes, getInfoMotoboom, connection)
        await processBike(aspgroupBikes, getInfoAspGroup, connection)
        await processBike(atvromBikes, getInfoAtvRom, connection)
        await processBike(beneliBikes, getInfoBeneli, connection)
        await processBike(betaBikes, getInfoBeta, connection)
        await processBike(kymcoBikes, getInfoKymco, connection)
        await processBike(piaggioBikes, getInfoPiaggio, connection)
        await processBike(polarisBikes, getInfoPolaris, connection)
        await processBike(polarisSnowmobiles, getInfoPolaris, connection)
        await processBike(segwayBikes, getInfoSegway, connection)
        await processSuzuki(suzukiBikes, getInfoSuzuki, connection)
        await processBike(swmBikes, getInfoSwm, connection)
        await processBike(symBikes, getInfoSym, connection)
        await processBike(vespaBikes, getInfoVespa, connection)
        await processBike(yamahaBikes, getInfoYamaha, connection)
    } catch (error) {
        console.log(error)
    } finally {
        console.log('Bikes data scraped successfully!')
        return true
    }

}