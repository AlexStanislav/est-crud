const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const xlsx = require('node-xlsx');
const xlsxUtils = require('xlsx')
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { URL } = require('url');
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer';
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow
const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }


  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ['script-src \'self\'']
      }
    })
  })

  session.fromPartition("persist:name")
    .setPermissionRequestHandler((webContents, permission, callback) => {
      const parsedUrl = new URL(webContents.getURL());

      if (permission === 'notifications' && parsedUrl.host !== 'localhost') {
        callback(false);
      } else {
        callback(true);
      }
    })

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// app.enableSandbox();
// app.on('web-contents-created', (event, contents) => {
//   contents.on('will-navigate', (event, navigationUrl) => {
//     const parsedUrl = new URL(navigationUrl);

//     if (parsedUrl.host !== 'localhost') {
//       event.preventDefault();
//     }
//   })
// })

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();
  installExtension(VUEJS_DEVTOOLS)
    .then((name) => console.log(`Added Extension:  ${name}`))
    .catch((err) => console.log('An error occurred: ', err));
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

let connectionInfo = {}

const { Pool } = require('pg');
let dynamicPool;
function createDynamicPool(user, password, host, database) {
  connectionInfo = { user, password, host, database, port: 5432, ssl: { rejectUnauthorized: false } }
  return new Pool({
    user: user,
    password: password,
    host: host,
    database: database,
    port: 5432,
    // ssl: { rejectUnauthorized: false }
  });
}


ipcMain.handle('connect-to-database', async (event, data) => {
  try {
    dynamicPool = createDynamicPool(data.username, data.password, data.host, data.database)
    console.log('Connected to PostgreSQL')
    return true
  } catch (error) {
    console.log(error)
    return false
  }
})

function extractNumbersFromString(str) {
  if (str.match(/\d+/g) !== null) return str.match(/\d+/g).map(Number);
}

ipcMain.handle('get-info', async () => {
  const connection = await dynamicPool.connect()
  const query = `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
  const tables = await connection.query(query)

  const bikes = {}
  for (const table of tables.rows) {
    if (table.tablename.includes('_bikes') || table.tablename.includes('_scooters') || table.tablename.includes('_atv') || table.tablename.includes('_snowmobiles') || table.tablename.includes('_ssv')) {
      const query = `SELECT * FROM ${table.tablename}`
      const result = await connection.query(query)
      bikes[table.tablename] = result.rows
    }
  }

  for (const bikeTypeIndex in bikes) {
    const bikeTypes = bikes[bikeTypeIndex]
    for (const bikeIndex in bikeTypes) {
      const bike = bikeTypes[bikeIndex]

      if (bike.permis !== 'undefined' && bike.permis !== 'null' && bike.permis !== null && bike.permis !== undefined) {
        bike.permis = bike.permis.replace(/[{}]+/g, "").replace(/\"+/g, "").split(",")
      } else {
        bike.permis = []
      }

      if (bike.rabla !== 'undefined' && bike.rabla !== 'null' && bike.rabla !== null && bike.rabla !== undefined) {
        bike.rabla = bike.rabla.toUpperCase()
      } else {
        bike.rabla = null
      }


      bike.gallery = bike.gallery.replace(/[{}]+/g, "").replace(/\"+/g, "").split(",")
      if (bike.capacitate !== "null" && typeof bike.capacitate === "string") {
        bike.capacitate = bike.capacitate.replace("cc", "").replace("CM3", "").replace("cmc", "").replace("c.c.", "").replace("cm3", "").replace(",", ".").trim()
      }

      if (bike.main_year === "undefined" || bike.main_year === "null" || bike.main_year === null || bike.main_year === undefined) {
        bike.main_year = null
      } else {
        bike.main_year = parseInt(bike.main_year)
      }

      if (bike.category === "undefined" || bike.category === "null" || bike.category === null || bike.category === undefined) {
        bike.category = null
      }

      if (bike.capacitate === "undefined" || bike.capacitate === "null" || bike.capacitate === null || bike.capacitate === undefined) {
        bike.capacitate = null
      }

      if (bike.capacitate === null) {
        const cilinderArray = extractNumbersFromString(bike.bike_name)
        for (const cilinderIndex in cilinderArray) {
          const cilinder = cilinderArray[cilinderIndex]
          if (cilinder >= 50) {
            bike.capacitate = cilinder
          }
        }
      }

      if (bike.capacitate !== null && (bike.permis.length === 0 || bike.permis.includes('{}'))) {
        const capacitate = parseInt(bike.capacitate)
        if (capacitate >= 50 && capacitate <= 125) {
          bike.permis = ['B']
        }
        if (capacitate > 125 && capacitate <= 500) {
          bike.permis = ['A2', 'A']
        }
        if (capacitate > 500 && capacitate <= 800) {
          bike.permis = ['A2']
        }
      }

      if (bike.price === "undefined" || bike.price === "null" || bike.price === null || bike.price === undefined) {
        bike.price = null
      }

      if (bike.old_price === "undefined" || bike.old_price === "null" || bike.old_price === null || bike.old_price === undefined) {
        bike.old_price = null
      }

      if (bike.price !== null) {
        bike.price = (bike.price.replace(/[.\s]+/g, ''))
      }
      if (bike.old_price !== null) {
        bike.old_price = (bike.old_price.replace(/[.\s]+/g, ''))
      }

      if (bike.price !== null) {
        if (bike.price.includes('{')) {
          let price = bike.price.replace("{", "[").replace("}", "]").toLowerCase().replace("NULL", "").replace("[,", "[").replace(/\'/g, "")
          bike.price = JSON.parse(price)
        } else {
          bike.price = [(bike.price)]
        }
      }

      if (bike.old_price !== null) {
        if (bike.old_price.includes('{')) {
          let price = bike.old_price.replace("{", "[").replace("}", "]").toLowerCase().replace("NULL", "").replace("[,", "[").replace(/\'/g, "")
          bike.old_price = JSON.parse(price)
        } else {
          bike.old_price = [(bike.old_price)]
        }
      }

      if (bike.colors === "undefined" || bike.colors === "null" || bike.colors === null || bike.colors === undefined) {
        bike.colors = null
      }

      if (bike.colors !== null) {
        bike.colors = JSON.parse(bike.colors.replace("{", "[").replace("}", ']'))
      }

      if (bike.colors_display === "undefined" || bike.colors_display === "null" || bike.colors_display === null || bike.colors_display === undefined) {
        bike.colors_display = null
      }

      if (bike.colors_display !== null) {
        bike.colors_display = bike.colors_display.replace('"{', '{').replace('}"', '}').replace(/\\"/g, '"')
      }
    }
  }

  connection.release()
  return bikes
})

ipcMain.handle('get-service-requests', async () => {
  const connection = await dynamicPool.connect()
  const query = `SELECT * FROM service_requests`
  try {
    const serviceRequests = await connection.query(query)
    return serviceRequests.rows
  } catch (error) {
    console.log(error)
  } finally {
    connection.release()
  }

})

ipcMain.handle('update-bike', async (event, data) => {
  const connection = await dynamicPool.connect();
  let {
    id,
    bike_name,
    bike_description,
    bike_slogan,
    price,
    old_price,
    image,
    gallery,
    brand,
    category,
    main_year,
    permis,
    rabla,
    gallery_image,
    gallery_description,
    gallery_title,
    is_gallery,
    is_popular,
    capacitate,
    vehicle_type,
    omologare,
    colors,
    display_model,
    colors_display
  } = data.bike;

  let permisValue = permis.length === 0 ? null : permis

  const updateQuery = {
    text: `
      UPDATE public."${data.tableName}"
      SET
        bike_name = $1,
        bike_description = $2,
        bike_slogan = $3,
        price = $4,
        old_price = $5,
        image = $6,
        gallery = $7,
        brand = $8,
        category = $9,
        main_year = $10,
        permis = $11,
        rabla = $12,
        gallery_image = $13,
        gallery_description = $14,
        gallery_title = $15,
        is_gallery = $16,
        is_popular = $17,
        capacitate = $18,
        vehicle_type = $19,
        omologare = $20,
        colors = $21,
        display_model = $22,
        colors_display = $23
      WHERE id = $24
    `,
    values: [
      bike_name,
      bike_description,
      bike_slogan,
      price,
      old_price,
      image,
      gallery,
      brand,
      category,
      main_year,
      permisValue,
      rabla,
      gallery_image,
      gallery_description,
      gallery_title,
      is_gallery,
      is_popular,
      capacitate,
      vehicle_type,
      omologare,
      colors,
      display_model,
      colors_display,
      id
    ]
  };

  try {
    await connection.query(updateQuery);
    console.log("Updated bike");
  } catch (error) {
    console.log(error);
  } finally {
    connection.release();
  }
});

ipcMain.handle('delete-bike', async (event, data) => {
  const connection = await dynamicPool.connect();
  const { id, tableName } = data;
  const deleteQuery = {
    text: `DELETE FROM public."${tableName}" WHERE id = $1`,
    values: [id],
  };
  try {
    await connection.query(deleteQuery);
    console.log("Deleted bike");
    return {
      success: true
    }
  } catch (error) {
    console.log(error);
  } finally {
    connection.release();
  }
});


ipcMain.handle('backup-db', async () => {
  const allTablesQuery = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
  const connection = await dynamicPool.connect();
  const allTables = await connection.query(allTablesQuery);
  const promises = allTables.rows.map((table) => {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM ${table.table_name}`;
      connection.query(query, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve({ table: table.table_name, data: result.rows });
        }
      });
    });
  });

  const data = await Promise.all(promises);

  try {
    data.forEach((table) => {
      const bikes = table.data
      const dataTable = []
      bikes.forEach(bike => {
        dataTable.push([
          bike.id,
          bike.bike_name,
          bike.bike_slogan,
          bike.bike_description,
          bike.main_year,
          bike.price,
          bike.old_price,
          bike.currency,
          bike.image,
          bike.gallery,
          bike.category,
          bike.rabla,
          bike.permis,
          bike.capacitate,
          bike.is_gallery,
          bike.gallery_image,
          bike.gallery_title,
          bike.gallery_description,
          bike.is_popular,
          bike.brand,
          bike.vehicle_type,
          bike.omologare,
          bike.colors,
          bike.display_model,
          bike.colors_display
        ])
      })

      const sheetOptions = {
        '!cols': [
          { wch: 50 },
          { wch: 50 },
          { wch: 20 },
          { wch: 20 },
          { wch: 20 },
          { wch: 20 },
          { wch: 20 },
          { wch: 20 },
          { wch: 20 },
          { wch: 20 },
          { wch: 20 },
          { wch: 20 },
          { wch: 20 },
          { wch: 20 },
          { wch: 20 },
          { wch: 20 },
          { wch: 20 },
          { wch: 20 },
          { wch: 20 },
          { wch: 20 },
          { wch: 20 },
          { wch: 20 },
          { wch: 20 },
          { wch: 20 },
          { wch: 40 },
        ]
      }

      const buffer = xlsx.build([{ name: table.table, data: dataTable }], { sheetOptions });
      fs.writeFileSync(`./backup/${table.table}.xlsx`, buffer);
    })

    return {
      success: true
    }
  } catch (error) {
    console.log(error);
  } finally {
    connection.release();
  }
})

ipcMain.handle('download-xls', async (event, data) => {
  const connection = await dynamicPool.connect();
  const query = `SELECT * FROM ${data}`
  const table = []
  try {
    const bikes = await connection.query(query)
    const file = JSON.stringify(bikes.rows).replace(/\\"/g, "'").replace(/\n/g, '')
    const bikesArr = JSON.parse(file)
    table.push(Object.keys(bikesArr[0]))

    bikesArr.forEach(bike => {
      table.push([
        bike.id,
        bike.bike_name,
        bike.bike_slogan,
        bike.bike_description,
        bike.main_year,
        bike.price,
        bike.old_price,
        bike.currency,
        bike.image,
        bike.gallery,
        bike.category,
        bike.rabla,
        bike.permis,
        bike.capacitate,
        bike.is_gallery,
        bike.gallery_image,
        bike.gallery_title,
        bike.gallery_description,
        bike.is_popular,
        bike.brand,
        bike.vehicle_type,
        bike.omologare,
        bike.colors,
        bike.display_model,
        bike.colors_display
      ])
    })

    const sheetOptions = {
      '!cols': [
        { wch: 50 },
        { wch: 50 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 40 },
      ]
    }

    const buffer = xlsx.build([{ name: 'bikes', data: table }], { sheetOptions })
    fs.writeFileSync(`./${data}.xlsx`, buffer)
    return {
      success: true
    }
  } catch (error) {
    console.log(error)
    return { success: false }
  } finally {
    connection.release()
  }
})

let currentXLSFile = null

ipcMain.handle('upload-table', async (event) => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'XLSX', extensions: ['xlsx'] }
    ]
  })
  try {
    if (filePaths[0] === undefined) {
      return { success: false }
    } else {
      currentXLSFile = xlsx.parse(fs.readFileSync(filePaths[0]))
      return {
        success: true, fileName: filePaths[0]
      }
    }
  } catch (error) {
    console.log(error)
    return { success: false }
  }
})

ipcMain.handle('update-table', async (event, data) => {
  const connection = await dynamicPool.connect()
  const tableColumnNames = currentXLSFile[0].data[0]

  let deleteQuery = `DELETE FROM public.${data}`

  try {
    await connection.query(deleteQuery)

    const tableQuery = {
      text: '',
      values: []
    }

    for (let i = 1; i < currentXLSFile[0].data.length; i++) {
      const row = currentXLSFile[0].data[i]
      tableQuery.text = `INSERT INTO public.${data} (${tableColumnNames.map(column => column).join(', ')}) VALUES (${tableColumnNames.map((_, index) => `$${index + 1}`).join(', ')})`

      tableQuery.values = [...row]

      if (tableQuery.values.length < 25) {
        tableQuery.values.push('null')
      }

      if (tableQuery.values[22] !== undefined) {
        tableQuery.values[22] = tableQuery.values[22].replace(/\'/g, '"')
      }

      if (tableQuery.values[24] !== undefined) {
        tableQuery.values[24] = tableQuery.values[24].replace(/\'/g, '"')
      }

      try {
        await connection.query(tableQuery)
      } catch (error) {
        console.log(error)
        return { success: false }
      }
    }


    return { success: true }

  } catch (error) {
    console.log(error)
    return { success: false }
  } finally {
    connection.release()
  }



  // for (let i = 1; i < currentXLSFile[0].data.length; i++) {
  //   console.log(`Updating row ${i}`)
  //   let tableQuery = `UPDATE public.${data} SET `
  //   const row = currentXLSFile[0].data[i]
  //   for (let j = 1; j < tableColumnNames.length; j++) {
  //     const columnName = tableColumnNames[j]
  //     let value = row[j]
  //     if (value !== undefined && typeof value === 'string' && value.includes("'")) {
  //       value = value.replace(/'/g, '"')
  //     }
  //     tableQuery += `${columnName} = '${value}'`
  //     if (j < tableColumnNames.length - 1) {
  //       tableQuery += ', '
  //     }
  //   }
  //   tableQuery += ` WHERE id = '${row[0]}';`

  //   console.log(tableQuery)

  //   try {
  //     await connection.query(tableQuery)
  //   } catch (error) {
  //     console.log(error)
  //     return { success: false }
  //   }
  // }


})


ipcMain.handle('save-new-table', async (event, data) => {
  const connection = await dynamicPool.connect()
  const { name, type } = data
  const tableColumnNames = currentXLSFile[0].data[0]

  const tableName = `${name}_${type}`

  let tableQuery = `CREATE TABLE IF NOT EXISTS public."${tableName}" (id text NOT NULL`
  let insertQuery = ``

  for (const column of tableColumnNames) {
    if (column === 'is_gallery' || column === 'is_popular') {
      tableQuery += `, ${column} boolean`
    } else {
      tableQuery += `, ${column} text`
    }
  }

  tableQuery += `);`


  try {
    await connection.query(tableQuery)
    for (let i = 1; i <= currentXLSFile[0].data.length; i++) {
      const row = currentXLSFile[0].data[i]
      if (row) {
        insertQuery = `INSERT INTO public."${tableName}" (id`
        for (const column of tableColumnNames) {
          insertQuery += `, ${column}`
        }
        const id = uuidv4()
        insertQuery += `) VALUES ('${id}'`
        for (const value of row) {
          insertQuery += `, '${value}'`
        }
        insertQuery += `);`

        try {
          await connection.query(insertQuery)
        } catch (error) {
          console.log(error)
        }
      }
    }
  } catch (error) {
    console.log(error)
  } finally {
    connection.release()
  }
})

ipcMain.handle('edit-table', async (event, data) => {
  const connection = await dynamicPool.connect()
  const keys = Object.keys(data.info)
  let query = {
    text: '',
    values: []
  }
  for (const key of keys) {
    if (data.info[key] !== "") {
      query.text = `UPDATE public.${data.tableName} SET ${key} = $1`
      query.values.push(data.info[key])
    }
  }

  try {
    connection.query(query)
    console.log('Table updated')
    return true
  } catch (error) {
    console.log(error)
    return false
  } finally {
    connection.release()
  }
})

ipcMain.handle('mark-request-as-active', async (event, id) => {
  const connection = await dynamicPool.connect()
  const query = `UPDATE public.service_requests SET is_active = true WHERE id = '${id}'`
  try {
    connection.query(query)
    console.log('Request marked as active')
    return true
  } catch (error) {
    console.log(error)
    return false
  } finally {
    connection.release()
  }
})

ipcMain.handle('mark-request-as-inactive', async (event, id) => {
  const connection = await dynamicPool.connect()
  const query = `UPDATE public.service_requests SET is_active = false WHERE id = '${id}'`
  try {
    connection.query(query)
    console.log('Request marked as inactive')
    return true
  } catch (error) {
    console.log(error)
    return false
  } finally {
    connection.release()
  }
})

ipcMain.handle('delete-request', async (event, id) => {
  const connection = await dynamicPool.connect()
  const query = `DELETE FROM public.service_requests WHERE id = '${id}'`
  try {
    connection.query(query)
    console.log('Request deleted')
    return true
  } catch (error) {
    console.log(error)
    return false
  } finally {
    connection.release()
  }
})

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
      category: null,
      omologare: null,
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
          if (detail.label.toLowerCase().includes('capacitate') || detail.label.toLowerCase().includes('matriculabil')) {
            infoArray.push(detail)
          }
        }

        for (const detail of infoArray) {
          if (detail.label.toLowerCase().includes("model")) {
            if (bikes[bikeName]) {
              bikesInfo[tableName][bikeName].mainYear = detail.value
              infoArray.splice(infoArray.indexOf(detail), 1)
            }
          }

          if (detail.label.toLowerCase().includes("matriculabil")) {
            bikesInfo[tableName][bikeName].omologare = detail.value.replace(/\n/g, "")
            if (bikesInfo[tableName][bikeName].omologare === "da") {
              bikesInfo[tableName][bikeName].omologare = ["t3b"]
            } else {
              bikesInfo[tableName][bikeName].omologare = null
            }
            infoArray.splice(infoArray.indexOf(detail), 1)
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

        mainWindow.webContents.send('bike-scraped', bikeName)
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

const getApriliaGallery = async (url) => {
  const browser = await puppeteer.launch({ headless: "new" })
  const page = await browser.newPage()

  await page.goto(url, { waitUntil: "networkidle0" })

  const $ = cheerio.load(await page.content())

  const gallery = []

  const categoryLinks = []

  $('a.card-product').each((index, element) => {
    const link = $(element).attr('href')
    categoryLinks.push("https://www.aprilia.com" + link)
  })

  console.log(categoryLinks)

  // for (const model of categoryLinks) {
  //   await page.goto(model, { waitUntil: "networkidle0" })

  //   const $ = cheerio.load(await page.content())

  //   const modelLinks = []

  //   $('a.card-product').each((index, element) => {
  //     const link = $(element).attr('href')
  //     modelLinks.push("https://www.aprilia.com" + link)
  //   })

  //   for (const link of modelLinks) {
  //     await page.goto(link, { waitUntil: "networkidle0" })

  //     const $ = cheerio.load(await page.content())

  //     const images = []

  //     $('.image-container').each((index, element) => {
  //       const image = $(element).find('img').attr('src')
  //       images.push(image)
  //     })

  //     const bikeName = link.split("/")[6].split("-").slice(0, 2).join("-")
  //     gallery.push({
  //       [bikeName]: images
  //     })
  //   }
  // }

  browser.close().then(() => { console.log("Aprilia gallery scraped") })
  // return gallery
}

const getInfoAspGroup = async (url, tableName) => {
  const browser = await puppeteer.launch({ headless: "new" })
  const page = await browser.newPage()

  await page.goto(url, { waitUntil: "networkidle0" })

  const $ = cheerio.load(await page.content());

  bikesInfo[tableName] = {}
  bikesLinks[tableName] = []

  if (url.includes("royal-enfield")) {
    $('.nav-item-royal-enfield').find('ul').find('li').each((index, element) => {
      const link = $(element).find('.nav-link').attr('href')
      bikesLinks[tableName].push(link)
      bikesLinks[tableName] = [...new Set(bikesLinks[tableName])]
    })
  } else {
    $('.vehicles-item').each((index, element) => {
      const link = $(element).find('a').attr('href')
      bikesLinks[tableName].push(link)
      bikesLinks[tableName] = [...new Set(bikesLinks[tableName])]
    })
  }


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

    const oldPriceInfo = []
    const priceInfo = []
    const omologare = []

    const cleanPriceInfoElement = priceInfoElement.map(element => element.replace(/\s+/g, ' ').trim()).filter(element => element.length > 0)

    for (const price of cleanPriceInfoElement) {
      let priceArray = price.toLowerCase().split("(tva inclus)")
      let priceString = priceArray[0]

      let regularPrice = priceString.split("€")[1].trim()
      let oldPrice = priceString.split("€")[0].trim()

      if (regularPrice === '') {
        regularPrice = oldPrice
        oldPrice = null
      } else if (oldPrice === '') {
        oldPrice = null
      }

      let omologareString = priceArray[1]

      let omologareMatch = omologareString.match(/\w\d\w/g)

      priceInfo.push(regularPrice)
      oldPriceInfo.push(oldPrice)
      omologare.push(omologareMatch !== null ? omologareMatch[0] : null)

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


    const category = finalLink.split("-")[0].replace("https://www.aspgroup.ro/", "")
    const getGallery = async function () {
      const gallery = []
      const galleryElement = $('figure').find('a')

      const galleryPromises = galleryElement.map((index, element) => {
        if ($(element).attr('href').includes(category)) {
          return `https://aspgroup.ro${$(element).attr('href')}`
        }
      }).get()

      const resolvedGallery = await Promise.all(galleryPromises)

      gallery.push(...resolvedGallery)

      return gallery
    }

    const gallery = await getGallery()


    const bikeObj = {
      bikeName,
      bikeSlogan,
      bikeDesc: bikeDesc[0][0],
      mainYear: null,
      priceInfo: {
        price: priceInfo,
        oldPrice: oldPriceInfo,
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
      ],
      omologare
    }

    bikesInfo[tableName][bikeName] = bikeObj

    mainWindow.webContents.send('bike-scraped', bikeName)
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

      mainWindow.webContents.send('bike-scraped', bikeName)
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

      mainWindow.webContents.send('bike-scraped', bikeName)
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
      const finalName = (`${$('h3.av-special-heading-tag').first().text().trim()}-(${spec})`).replace(/-\(.+\)/g, '')
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

      mainWindow.webContents.send('bike-scraped', bikeName)
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
        const priceElement = $(element).find('strong')

        if (priceElement.length !== 0) {
          bikePrice = priceElement.text().trim().replace("€", "").split(".")[0].replace(",", "").trim()
        }
        // if ($(element).text().includes("€")) {
        //   bikePrice = $(element).text().trim().replace("€", "").split(".")[0].replace(",", "").trim()
        // }
      })

      $('span').each((index, element) => {
        if ($(element).attr('style') === "text-decoration: line-through;") {
          oldPrice = $(element).text().trim().replace("€", "").split(".")[0].replace(",", "").trim()
        }
      })

      const getGallery = async function () {
        const galleryArray = []
        const galleryElement = $('div.modula-items')

        const galleryPromises = galleryElement.map((index, element) => {
          return $(element).find('img').map((index, element) => {
            return ($(element).attr('data-full'))
          }).get()
        }).get()

        const resolvedGallery = await Promise.all(galleryPromises)
        galleryArray.push(...resolvedGallery)
        return galleryArray
      }

      const galleryInfo = await getGallery()

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
        image: galleryInfo[0],
        gallery: galleryInfo,
        category: null,
        motorInfo
      }

      bikesInfo[tableName][bikeName] = bikeObject

      mainWindow.webContents.send('bike-scraped', bikeName)
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
    let bikeDesc = $('.editorial-icon__text').find('p').text().trim()

    if (bikeDesc === "") {
      bikeDesc = $('.editorial__content').find('p').text().trim()
    }
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

    const colorsElement = $('.product-presentation_colors__swatches').find('li')

    let colorsArray = []
    colorsElement.each((index, element) => {
      const icon = $(element).find('i');

      if (icon.attr('style') !== undefined) {
        const color = icon.find('span').text().replace("-", " ").trim()
        const colorValue = icon.attr('style').split(";")[0].split(":")[1].trim()

        colorsArray.push({ color, colorValue })
      }
    })

    const rgbToHex = (rgb) => {
      const [r, g, b] = rgb.match(/\w+/g).slice(1)
      return `#${[r, g, b].map(x => {
        const hex = Number(x).toString(16)
        return hex.length === 1 ? `0${hex}` : hex
      }).join('')}`
    }

    colorsArray = colorsArray.map(color => {
      color.colorValue = rgbToHex(color.colorValue)
      return color
    })

    const colorsObject = colorsArray.reduce((acc, curr) => {
      acc[curr.color] = curr.colorValue
      return acc
    }, {})


    const galleryElement = $('.gallery__container').find('li')

    let galleryArray = []
    if (galleryElement !== undefined) {
      galleryElement.each((index, element) => {
        const src = $(element).find('img').attr('src')
        if (src !== undefined) {
          galleryArray.push(src)
        }
      })
    }

    const colorsArrayWithIsDisplayed = colorsArray.map((color, index) => {
      return {
        ...color,
        is_displayed: index === 0
      }
    })

    const colorNamesArray = colorsArray.map(color => color.color)

    for (const { color, colorValue, is_displayed } of colorsArrayWithIsDisplayed) {
      const bikeObj = {
        bikeName: `${bikeName}-${color}`,
        bikeSlogan,
        bikeDesc,
        mainYear,
        priceInfo: {
          price,
          oldPrice: null,
          currency: "EUR"
        },
        image: imageData,
        gallery: galleryArray,
        category: category,
        info: [],
        colors: colorNamesArray,
        colors_display: {
          ...colorsObject,
          [color]: colorValue
        },
        is_displayed
      }

      bikesInfo[tableName][`${bikeName}-${color}`] = bikeObj
    }

    mainWindow.webContents.send('bike-scraped', bikeName)
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

            const bikeNameElement = $('h3')

            const nameArr = []
            bikeNameElement.map((index, element) => {
              const bikeName = $(element).find('strong').text().trim()
              nameArr.push(bikeName)
            })

            nameArr.slice(0, 2)

            const bikeName = nameArr.length > 0 ? nameArr[0].toLowerCase().replace(" ", "-").trim() + ' ' + nameArr[1].toLowerCase().replace(" ", "-").trim() : null

            const omologareStrings = ['t3b', 'l7e']
            const omologareMatch = new RegExp(omologareStrings.join("|"), "g")
            const omologare = (`${link.split("/")[3]}-${link.split("/")[4]}`).match(omologareMatch)

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
              ],
              omologare: omologare
            }

            bikesInfo[tableName][bikeName] = bikeObj


            mainWindow.webContents.send('bike-scraped', bikeName)
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

    const oldPriceInfo = []
    const priceInfo = []
    const omologare = []

    const cleanPriceInfoElement = priceInfoElement.map(element => element.replace(/\s+/g, ' ').trim()).filter(element => element.length > 0)

    if (!cleanPriceInfoElement[0].includes("curând")) {
      for (const price of cleanPriceInfoElement) {
        let priceArray = price.toLowerCase().split("(tva inclus)")
        let priceString = priceArray[0]

        let regularPrice = priceString.split("€")[1].trim()
        let oldPrice = priceString.split("€")[0].trim()

        if (regularPrice === '') {
          regularPrice = oldPrice
          oldPrice = null
        } else if (oldPrice === '') {
          oldPrice = null
        }

        let omologareString = priceArray[1]

        let omologareMatch = omologareString.match(/\w\d\w/g)

        priceInfo.push(regularPrice)
        oldPriceInfo.push(oldPrice)
        omologare.push(omologareMatch !== null ? omologareMatch[0] : null)

      }
    }

    const colors = []

    // const colorsElement = $('.product-icons').find('img')

    // colorsElement.each((index, element) => {
    //   const fileExtenstions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.bmp', '.tiff', '.ico']
    //   const match = new RegExp(`(${fileExtenstions.join('|')})$`)
    //   const color = $(element).attr('alt').replace(match, '')
    //   colors.push(color)
    // })


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
        oldPrice: oldPriceInfo,
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
      ],
      omologare: omologare,
      colors: colors
    }

    bikesInfo[tableName][bikeName] = bikeObj

    mainWindow.webContents.send('bike-scraped', bikeName)
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

    mainWindow.webContents.send('bike-scraped', bikeName)
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

  const slideElements = $('.wpcp-slide-image').find('a')

  slideElements.each((index, element) => {
    const link = $(element).attr('href')
    if (link.includes('/swm-moto/'))
      bikesLinks[tableName].push(link)
  })

  bikesLinks[tableName] = [...new Set(bikesLinks[tableName])]

  for (const link of bikesLinks[tableName]) {
    if (link === undefined) continue

    await page.goto(link, { waitUntil: "networkidle0" })

    const $ = cheerio.load(await page.content())

    let category = $('h3.vc_custom_heading').text().trim()

    if (category.toLowerCase() === 'off road') {
      category = 'Enduro'
    }

    if (category.toLowerCase() === 'on road') {
      category = 'Travel'
    }

    if (category.toLowerCase() === 'e-bike') {
      category = 'E-RIDE'
    }

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

    mainWindow.webContents.send('bike-scraped', bikeName)
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

          mainWindow.webContents.send('bike-scraped', bikeName)
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
      const bikeName = $('.title').text().trim() !== '' ? $('.title').text().trim() : $('.product-presentation__title').text().trim()
      const mainYear = html.split("-")[html.split("-").length - 1]
      const bikeDesc = $('.editorial__text').text().trim()
      const price = $('.product-price__list').text().trim().split(" ")[1]

      // const getImage = async () => {
      //   const image = $('.product-image')

      //   const imageSrc = image.map((index, element) => {
      //     const src = $(element).attr('src')
      //     if (src !== undefined && src.includes("vehicles")) {
      //       return src
      //     }
      //   }).get()

      //   const imageData = await Promise.all(imageSrc)

      //   return imageData[0]
      // }

      // const imageData = await getImage()

      const imageData = $('.product-image').attr('src') !== undefined ? $('.product-image').attr('src') : $('.hooper-slide').find('img').attr('src')

      const category = link.split("/")[3]

      const colorsElement = $('.product-presentation_colors__swatches').find('li')

      let colorsArray = []
      colorsElement.each((index, element) => {
        const icon = $(element).find('i');

        if (icon.attr('style') !== undefined) {
          const color = icon.find('span').text().replace("-", " ").trim()
          const colorValue = icon.attr('style').split(";")[0].split(":")[1].trim()

          colorsArray.push({ color, colorValue })
        }
      })

      const rgbToHex = (rgb) => {
        const [r, g, b] = rgb.match(/\w+/g).slice(1)
        return `#${[r, g, b].map(x => {
          const hex = Number(x).toString(16)
          return hex.length === 1 ? `0${hex}` : hex
        }).join('')}`
      }

      colorsArray = colorsArray.map(color => {
        color.colorValue = rgbToHex(color.colorValue)
        return color
      })

      const colorsObject = colorsArray.reduce((acc, curr) => {
        acc[curr.color] = curr.colorValue
        return acc
      }, {})

      const colorsArrayWithIsDisplayed = colorsArray.map((color, index) => {
        return {
          ...color,
          is_displayed: index === 0
        }
      })

      const colorNamesArray = colorsArray.map(color => color.color)

      for (const { color, colorValue, is_displayed } of colorsArrayWithIsDisplayed) {
        const bikeObj = {
          bikeName: `${bikeName}-${color}`,
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
          info: [],
          colors: colorNamesArray,
          colors_display: {
            ...colorsObject,
            [color]: colorValue
          },
          is_displayed
        }

        bikesInfo[tableName][`${bikeName}-${color}`] = bikeObj

        mainWindow.webContents.send('bike-scraped', bikeName)
        console.log(`${bikeName} scraped`)
      }

    }
  }
  browser.close().then(() => console.log(`${tableName} scraped`))
}

const getInfoYamaha = async function (url, tableName) {
  const browser = await puppeteer.launch({ headless: "new" })
  const page = await browser.newPage()

  await page.goto(url, { waitUntil: "networkidle0", timeout: 0 })

  const $ = cheerio.load(await page.content())

  bikesLinks[tableName] = []
  bikesInfo[tableName] = {}

  $('a.bdikOt').each(async (index, element) => {
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

    mainWindow.webContents.send('bike-scraped', bikeId)
    console.log(`${bikeId} scraped`)

  }

  browser.close().then(() => console.log(`${tableName} scraped`))
}

const getInfoMotoguzzi = async function (url, tableName) {
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

  const baseUrl = "https://www.motoguzzi.com/us_EN/"
  for (const categoryLink of categories) {
    const finalLink = baseUrl + categoryLink.replace("/us_EN/", "")
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

  const baseURL = "https://www.motoguzzi.com/us_EN/"
  for (const link of bikesLinks[tableName]) {
    const finalLink = baseURL + link.replace("/us_EN/", "")
    await page.goto(finalLink, { waitUntil: "networkidle0" })
    const $ = cheerio.load(await page.content())
    const bikeName = $('.title').text().trim() !== "" ? $('.title').text().trim() : $('.product-presentation__title').text().trim()
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

    const gallery = []

    $('.swiper-slide').find('img').each((index, element) => {
      gallery.push($(element).attr('src'))
    })

    let imageData = await getImage() !== undefined ? await getImage() : null

    if (imageData === null && gallery.length > 0) {
      imageData = gallery[0]
    }

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
      gallery: gallery,
      category: category,
      info: []
    }

    bikesInfo[tableName][bikeName] = bikeObj

    mainWindow.webContents.send('bike-scraped', bikeName)
    console.log(`${bikeName} scraped`);
  }

  browser.close().then(() => console.log(`${tableName} scraped`))
}

const motoguzziBikes = [
  {
    url: 'https://www.motoguzzi.com/us_EN/models/',
    type: 'motocicleta',
    tableName: 'motoguzzi',
  }
]

const apriliaBikes = [
  {
    url: 'https://www.motoboom.ro/moto-Aprilia?limit=100',
    type: 'motocicleta',
    tableName: 'aprilia',
    categoryUrl: 'https://www.aprilia.com/en_EN/models/'
  }
]

const motoBoomBikes = [
  {
    url: 'https://www.motoboom.ro/scuter-aprilia?limit=100',
    type: 'scuter',
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
]

const motoBoomAtv = [
  {
    url: 'https://www.motoboom.ro/can-am?limit=100',
    type: 'atv',
    tableName: 'canam',
    categoryUrl: null
  }
]

const motoBoomSSV = [
  {
    url: 'https://www.motoboom.ro/can-am-ssv?limit=100',
    type: 'ssv',
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
    url: 'https://www.aspgroup.ro/argo',
    type: 'atv',
    tableName: 'aspgroup',
  },
  {
    url: 'https://aspgroup.ro/royal-enfield',
    type: 'bikes',
    tableName: 'royal_enfield',
  }
]

const aspgroupSSV = [
  {
    url: 'https://www.aspgroup.ro/linhai',
    type: 'atv',
    tableName: 'aspgroup',
  }
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
  }
]

const polarisSSV = [
  {
    url: 'https://polarisofficial.ro/rzr',
    type: 'ssv',
    tableName: 'polaris',
  },
  {
    url: 'https://polarisofficial.ro/ranger',
    type: 'ssv',
    tableName: 'polaris',
  },
  {
    url: 'https://polarisofficial.ro/general',
    type: 'ssv',
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
  }
]

const segwaySSV = [
  {
    url: 'https://segwaypowersports.ro/utv',
    type: 'ssv',
    tableName: 'segway',
  },
  {
    url: 'https://segwaypowersports.ro/ssv',
    type: 'ssv',
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
    url: 'https://swm-motorcycles.it/range',
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
    url: "https://www.yamaha-motor.eu/ro/ro/motorcycles/competition/?page=1&perPage=24",
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
  },
]

const yamahaSSV = [
  {
    url: 'https://www.motoboom.ro/utv-side-by-side-yamaha?limit=100',
    type: 'ssv',
    tableName: 'yamaha',
    categoryUrl: null
  }
]

const dbQuery = async (bikesInfo, type, tableName, connection) => {
  const tableTypes = {
    'motocicleta': 'bikes',
    'scuter': 'scooters',
    'atv': 'atv',
    'ssv': 'ssv',
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
                vehicle_type text,
                omologare text,
                colors VARCHAR(255),
                display_model boolean,
                colors_display VARCHAR(255)
            )`

    try {
      await connection.query(tableQuery)
      mainWindow.webContents.send('table-created', tableName)
      console.log(`Created table: ${tableName}`)
    } catch (error) {
      mainWindow.webContents.send('error', error)
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
      if (bike.priceInfo.price !== undefined && Array.isArray(bike.priceInfo.price)) {
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
      if (tableName === 'aspgroup') {
        infoQuery.values.push(bike.category)
      } else {
        infoQuery.values.push(tableName)
      }
      infoQuery.values.push(tableType)
      infoQuery.values.push(bike.omologare)
      if (bike.colors !== undefined) {
        infoQuery.values.push(bike.colors)
      } else {
        infoQuery.values.push(null)
      }
      if (bike.is_displayed !== undefined) {
        infoQuery.values.push(bike.is_displayed)
      } else {
        infoQuery.values.push(true)
      }
      if (bike.colors_display !== undefined) {
        infoQuery.values.push(bike.colors_display)
      } else {
        infoQuery.values.push(null)
      }

      infoQuery.text = `INSERT INTO public.${tableName}_${tableType}
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
            ON CONFLICT (bike_name) DO UPDATE 
            SET price = COALESCE(EXCLUDED.price, public.${tableName}_${tableType}.price), 
                old_price = COALESCE(EXCLUDED.old_price, public.${tableName}_${tableType}.old_price),
                image = COALESCE(EXCLUDED.image, public.${tableName}_${tableType}.image), 
                gallery = COALESCE(EXCLUDED.gallery, public.${tableName}_${tableType}.gallery),
                omologare = COALESCE(EXCLUDED.omologare, public.${tableName}_${tableType}.omologare);`

      try {
        await connection.query(infoQuery)
        console.log(`Inserted data into table: ${tableName}`)
        mainWindow.webContents.send('data-inserted', tableName)
      } catch (error) {
        mainWindow.webContents.send('error', error)
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


const scraper = async (connection) => {
  try {
    await processMotoBoomBike(motoBoomBikes, getInfoMotoboom, connection)
    await processMotoBoomBike(motoBoomAtv, getInfoMotoboom, connection)
    await processMotoBoomBike(motoBoomSSV, getInfoMotoboom, connection)
    await processBike(aspgroupBikes, getInfoAspGroup, connection)
    await processBike(aspgroupSSV, getInfoAspGroup, connection)
    await processBike(atvromBikes, getInfoAtvRom, connection)
    await processBike(beneliBikes, getInfoBeneli, connection)
    await processBike(betaBikes, getInfoBeta, connection)
    await processBike(kymcoBikes, getInfoKymco, connection)
    await processBike(piaggioBikes, getInfoPiaggio, connection)
    await processBike(polarisBikes, getInfoPolaris, connection)
    await processBike(polarisSSV, getInfoPolaris, connection)
    await processBike(polarisSnowmobiles, getInfoPolaris, connection)
    await processBike(segwayBikes, getInfoSegway, connection)
    await processBike(segwaySSV, getInfoSegway, connection)
    await processSuzuki(suzukiBikes, getInfoSuzuki, connection)
    await processBike(swmBikes, getInfoSwm, connection)
    await processBike(symBikes, getInfoSym, connection)
    await processBike(vespaBikes, getInfoVespa, connection)
    await processBike(yamahaBikes, getInfoYamaha, connection)
    await processBike(yamahaSSV, getInfoYamaha, connection)
    await processBike(motoguzziBikes, getInfoMotoguzzi, connection)
  } catch (error) {
    mainWindow.webContents.send('error', error)
    console.log(error)
  } finally {
    mainWindow.webContents.send('data-scraped')
    console.log('Bikes data scraped successfully!')
  }
}


ipcMain.handle('scrape-aprilia-bikes', async (event) => {
  const connection = await dynamicPool.connect()
  try {
    await processMotoBoomBike(apriliaBikes, getInfoMotoboom, connection)
  } catch (error) {
    mainWindow.webContents.send('error', error)
    console.log(error)
  } finally {
    mainWindow.webContents.send('data-scraped')
    connection.release()
  }
})

ipcMain.handle('scrape-motoboom-bikes', async (event) => {
  const connection = await dynamicPool.connect()
  try {
    await processMotoBoomBike(motoBoomBikes, getInfoMotoboom, connection)
  } catch (error) {
    mainWindow.webContents.send('error', error)
    console.log(error)
  } finally {
    mainWindow.webContents.send('data-scraped')
    connection.release()
  }
})

ipcMain.handle('scrape-motoboom-atv', async (event) => {
  const connection = await dynamicPool.connect()
  try {
    await processMotoBoomBike(motoBoomAtv, getInfoMotoboom, connection)
  } catch (error) {
    mainWindow.webContents.send('error', error)
    console.log(error)
  } finally {
    mainWindow.webContents.send('data-scraped')
    connection.release()
  }
})

ipcMain.handle('scrape-motoboom-ssv', async (event) => {
  const connection = await dynamicPool.connect()
  try {
    await processMotoBoomBike(motoBoomSSV, getInfoMotoboom, connection)
  } catch (error) {
    mainWindow.webContents.send('error', error)
    console.log(error)
  } finally {
    mainWindow.webContents.send('data-scraped')
    connection.release()
  }
})

ipcMain.handle('scrape-aspgroup', async (event) => {
  const connection = await dynamicPool.connect()
  try {
    await processBike(aspgroupBikes, getInfoAspGroup, connection)
  } catch (error) {
    mainWindow.webContents.send('error', error)
    console.log(error)
  } finally {
    mainWindow.webContents.send('data-scraped')
    connection.release()
  }
})

ipcMain.handle('scrape-aspgroup-ssv', async (event) => {
  const connection = await dynamicPool.connect()
  try {
    await processBike(aspgroupSSV, getInfoAspGroup, connection)
  } catch (error) {
    mainWindow.webContents.send('error', error)
    console.log(error)
  } finally {
    mainWindow.webContents.send('data-scraped')
    connection.release()
  }
})

ipcMain.handle('scrape-atvrom', async (event) => {
  const connection = await dynamicPool.connect()
  try {
    await processBike(atvromBikes, getInfoAtvRom, connection)
  } catch (error) {
    mainWindow.webContents.send('error', error)
    console.log(error)
  } finally {
    mainWindow.webContents.send('data-scraped')
    connection.release()
  }
})

ipcMain.handle('scrape-beneli', async (event) => {
  const connection = await dynamicPool.connect()
  try {
    await processBike(beneliBikes, getInfoBeneli, connection)
  } catch (error) {
    mainWindow.webContents.send('error', error)
    console.log(error)
  } finally {
    mainWindow.webContents.send('data-scraped')
    connection.release()
  }
})

ipcMain.handle('scrape-beta', async (event) => {
  const connection = await dynamicPool.connect()
  try {
    await processBike(betaBikes, getInfoBeta, connection)
  } catch (error) {
    mainWindow.webContents.send('error', error)
    console.log(error)
  } finally {
    mainWindow.webContents.send('data-scraped')
    connection.release()
  }
})

ipcMain.handle('scrape-kymco', async (event) => {
  const connection = await dynamicPool.connect()
  try {
    await processBike(kymcoBikes, getInfoKymco, connection)
  } catch (error) {
    mainWindow.webContents.send('error', error)
    console.log(error)
  } finally {
    mainWindow.webContents.send('data-scraped')
    connection.release()
  }
})

ipcMain.handle('scrape-motoguzzi', async (event) => {
  const connection = await dynamicPool.connect()
  try {
    await processBike(motoguzziBikes, getInfoMotoguzzi, connection)
  } catch (error) {
    mainWindow.webContents.send('error', error)
    console.log(error)
  } finally {
    mainWindow.webContents.send('data-scraped')
    connection.release()
  }
})

ipcMain.handle('scrape-piaggio', async (event) => {
  const connection = await dynamicPool.connect()
  try {
    await processBike(piaggioBikes, getInfoPiaggio, connection)
  } catch (error) {
    mainWindow.webContents.send('error', error)
    console.log(error)
  } finally {
    mainWindow.webContents.send('data-scraped')
    connection.release()
  }
})

ipcMain.handle('scrape-polaris', async (event) => {
  const connection = await dynamicPool.connect()
  try {
    await processBike(polarisBikes, getInfoPolaris, connection)
  } catch (error) {
    mainWindow.webContents.send('error', error)
    console.log(error)
  } finally {
    mainWindow.webContents.send('data-scraped')
    connection.release()
  }
})

ipcMain.handle('scrape-polaris-ssv', async (event) => {
  const connection = await dynamicPool.connect()
  try {
    await processBike(polarisSSV, getInfoPolaris, connection)
  } catch (error) {
    mainWindow.webContents.send('error', error)
    console.log(error)
  } finally {
    mainWindow.webContents.send('data-scraped')
    connection.release()
  }
})

ipcMain.handle('scrape-polaris-snowmobiles', async (event) => {
  const connection = await dynamicPool.connect()
  try {
    await processBike(polarisSnowmobiles, getInfoPolaris, connection)
  } catch (error) {
    mainWindow.webContents.send('error', error)
    console.log(error)
  } finally {
    mainWindow.webContents.send('data-scraped')
    connection.release()
  }
})

ipcMain.handle('scrape-segway', async (event) => {
  const connection = await dynamicPool.connect()
  try {
    await processBike(segwayBikes, getInfoSegway, connection)
  } catch (error) {
    mainWindow.webContents.send('error', error)
    console.log(error)
  } finally {
    mainWindow.webContents.send('data-scraped')
    connection.release()
  }
})

ipcMain.handle('scrape-segway-ssv', async (event) => {
  const connection = await dynamicPool.connect()
  try {
    await processBike(segwaySSV, getInfoSegway, connection)
  } catch (error) {
    mainWindow.webContents.send('error', error)
    console.log(error)
  } finally {
    mainWindow.webContents.send('data-scraped')
    connection.release()
  }
})

ipcMain.handle('scrape-suzuki', async (event) => {
  const connection = await dynamicPool.connect()
  try {
    await processSuzuki(suzukiBikes, getInfoSuzuki, connection)
  } catch (error) {
    mainWindow.webContents.send('error', error)
    console.log(error)
  } finally {
    mainWindow.webContents.send('data-scraped')
    connection.release()
  }
})

ipcMain.handle('scrape-swm', async (event) => {
  const connection = await dynamicPool.connect()
  try {
    await processBike(swmBikes, getInfoSwm, connection)
  } catch (error) {
    mainWindow.webContents.send('error', error)
    console.log(error)
  } finally {
    mainWindow.webContents.send('data-scraped')
    connection.release()
  }
})

ipcMain.handle('scrape-sym', async (event) => {
  const connection = await dynamicPool.connect()
  try {
    await processBike(symBikes, getInfoSym, connection)
  } catch (error) {
    mainWindow.webContents.send('error', error)
    console.log(error)
  } finally {
    mainWindow.webContents.send('data-scraped')
    connection.release()
  }
})

ipcMain.handle('scrape-vespa', async (event) => {
  const connection = await dynamicPool.connect()
  try {
    await processBike(vespaBikes, getInfoVespa, connection)
  } catch (error) {
    mainWindow.webContents.send('error', error)
    console.log(error)
  } finally {
    mainWindow.webContents.send('data-scraped')
    connection.release()
  }
})

ipcMain.handle('scrape-yamaha', async (event) => {
  const connection = await dynamicPool.connect()
  try {
    await processBike(yamahaBikes, getInfoYamaha, connection)
  } catch (error) {
    mainWindow.webContents.send('error', error)
    console.log(error)
  } finally {
    mainWindow.webContents.send('data-scraped')
    connection.release()
  }
})

ipcMain.handle('scrape-yamaha-ssv', async (event) => {
  const connection = await dynamicPool.connect()
  try {
    await processBike(yamahaSSV, getInfoYamaha, connection)
  } catch (error) {
    mainWindow.webContents.send('error', error)
    console.log(error)
  } finally {
    mainWindow.webContents.send('data-scraped')
    connection.release()
  }
})

ipcMain.handle('scrape-info', async (event) => {
  const connection = await dynamicPool.connect()
  try {
    await scraper(connection, event)
  } catch (error) {
    console.log(error)
  } finally {
    connection.release()
  }
})



// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
