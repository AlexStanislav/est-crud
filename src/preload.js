// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
    connectToDatabase: (data) => ipcRenderer.invoke('connect-to-database', data),
    getInfo: () => ipcRenderer.invoke('get-info'),
    updateBike: (bike, tableName) => ipcRenderer.invoke('update-bike', { bike, tableName }),
    deleteBike: (bikeID) => ipcRenderer.invoke('delete-bike', bikeID),
    generateXLS: () => ipcRenderer.invoke('generate-xls'),
    uploadTable: () => ipcRenderer.invoke('upload-table'),
    saveNewTable: (data) => ipcRenderer.invoke('save-new-table', data),
    editTable: (data) => ipcRenderer.invoke('edit-table', data),
    getServiceInfo: () => ipcRenderer.invoke('get-service-requests'),
    deleteRequest: (id) => ipcRenderer.invoke('delete-request', id),
    markRequestAsActive: (id) => ipcRenderer.invoke('mark-request-as-active', id),
    markRequestAsInactive: (id) => ipcRenderer.invoke('mark-request-as-inactive', id),
    scrapeInfo: () => ipcRenderer.invoke('scrape-info'),
    scrapeSpecific: (scrapeId) => ipcRenderer.invoke(`${scrapeId}`),
    getPiniaStore: () => getPiniaStore(),
    onBikeScraped: (cb) => ipcRenderer.on('bike-scraped', (event, data) => cb(data)),
    onTableScraped: (cb) => ipcRenderer.on('table-created', (event, data) => cb(data)),
    onDataInserted: (cb) => ipcRenderer.on('data-inserted', (event, data) => cb(data)),
    onDataScraped: (cb) => ipcRenderer.on('data-scraped', (event, data) => cb(data)),
    onScrapeError: (cb) => ipcRenderer.on('error', (event, data) => cb(data)),
    downloadTable: (data) => ipcRenderer.invoke('download-xls', data),
    updateTable: (data) => ipcRenderer.invoke('update-table', data)
})