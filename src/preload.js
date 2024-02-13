// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
    connectToDatabase: (data) => ipcRenderer.invoke('connect-to-database', data),
    getInfo: () => ipcRenderer.invoke('get-info'),
    updateBike: (bike, tableName) => ipcRenderer.invoke('update-bike', {bike, tableName}),
    generateXLS: () => ipcRenderer.invoke('generate-xls'),
    uploadTable: () => ipcRenderer.invoke('upload-table'),
    saveNewTable: (data) => ipcRenderer.invoke('save-new-table', data),
    editTable: (data) => ipcRenderer.invoke('edit-table', data),
    getServiceInfo: () => ipcRenderer.invoke('get-service-requests'),
    deleteRequest: (id) => ipcRenderer.invoke('delete-request', id),
    markRequestAsActive: (id) => ipcRenderer.invoke('mark-request-as-active', id),
    markRequestAsInactive: (id) => ipcRenderer.invoke('mark-request-as-inactive', id)
})
