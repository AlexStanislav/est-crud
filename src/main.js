const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const xlsx = require('node-xlsx');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { URL } = require('url');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
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

app.enableSandbox();
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    if (parsedUrl.host !== 'localhost') {
      event.preventDefault();
    }
  })
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);


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

const { Pool } = require('pg');
let dynamicPool;
function createDynamicPool(user, password, host) {
  return new Pool({
    user: user,
    password: password,
    host: host,
    database: "estbike",
  });
}


ipcMain.handle('connect-to-database', async (event, data) => {
  console.log(event)
  try {
    dynamicPool = createDynamicPool(data.username, data.password, data.host)
    console.log('Connected to PostgreSQL')
    return true
  } catch (error) {
    console.log(error)
    return false
  }
})

ipcMain.handle('get-info', async () => {
  const connection = await dynamicPool.connect()
  const query = `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
  const tables = await connection.query(query)

  const bikes = {}
  for (const table of tables.rows) {
    const query = `SELECT * FROM ${table.tablename}`
    const result = await connection.query(query)
    bikes[table.tablename] = result.rows
  }

  for (const bikeTypeIndex in bikes) {
    const bikeTypes = bikes[bikeTypeIndex]
    for (const bikeIndex in bikeTypes) {
      const bike = bikeTypes[bikeIndex]

      if (bike.permis !== 'undefined' && bike.permis !== 'null' && bike.permis !== null && bike.permis !== undefined) {
        const permisArray = bike.permis.split(" ").filter(item => item !== "")
        bike.permis = permisArray
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

      if (bike.price === "undefined" || bike.price === "null" || bike.price === null || bike.price === undefined) {
        bike.price = null
      }

      if (bike.price !== null && bike.price !== undefined && bike.price !== "null" && bike.price !== "undefined" && bike.price.includes("{")) {
        bike.price = parseInt(bike.price.replace(/[{}]/g, "").replace(/\"/g, "").split(",")[0].replace(/[.,\s]+/g, ""))
      } else if (bike.price !== null && bike.price !== undefined && bike.price !== "null" && bike.price !== "undefined") {

        bike.price = parseInt(bike.price.replace(/[.,\s]+/g, ""))
      }

      if (bike.old_price !== null && bike.old_price !== undefined && bike.old_price !== "null" && bike.old_price !== "undefined") {
        bike.old_price = parseInt(bike.old_price.replace(/[.,\s]+/g, ""))
      }

      if (bike.old_price === null || bike.old_price === undefined || bike.old_price === "null" || bike.old_price === "undefined") {
        bike.old_price = null
      }

      if (bike.price === null && bike.old_price !== null) {
        bike.price = bike.old_price
      }

      if (bike.price === bike.old_price) {
        bike.old_price = null
      }
    }
  }

  return bikes
})

ipcMain.handle('update-bike', async (event, data) => {
  const connection = await dynamicPool.connect();
  const {
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
    capacitate
  } = data.bike;

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
        capacitate = $18
      WHERE id = $19
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
      permis,
      rabla,
      gallery_image,
      gallery_description,
      gallery_title,
      is_gallery,
      is_popular,
      capacitate,
      id
    ]
  };

  await connection.query(updateQuery);
  console.log("Updated bike");
});

let currentXLSFile = null

ipcMain.handle('upload-table', async (event) => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'XLSX', extensions: ['xlsx'] }
    ]
  })
  try {
    currentXLSFile = xlsx.parse(fs.readFileSync(filePaths[0]))
    return { success: true, fileName: filePaths[0] }
  } catch (error) {
    console.log(error)
    return { success: false }
  }

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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
