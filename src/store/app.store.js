import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
    state: () => ({
        isConnected: false,
        allBikes: {},
        allRequests: [],
        showScrapeLog: false,
        scrapeLog: '',
    }),
    actions: {
        async connect(data) {
            const isConnected = window.electronAPI.connectToDatabase(data)
            this.isConnected = await isConnected
        },
        async addToScrapeLog(data) {
            // Get the current date and time
            const now = new Date();

            // Extract the hour, minute, and second components
            const hour = String(now.getHours()).padStart(2, '0');
            const minute = String(now.getMinutes()).padStart(2, '0');
            const second = String(now.getSeconds()).padStart(2, '0');

            // Create a variable that stores the timestamp in the format hour:minute:second
            const timestamp = `${hour}:${minute}:${second}`;

            console.log(timestamp); // Output will be in the format hour:minute:second, for example, 14:30:45
            this.scrapeLog += `${timestamp}  ${data}\n`
        },
        async toggleScrapeLog(value = null) {
            this.showScrapeLog = value || !this.showScrapeLog
        },
        async scrapeInfo() {
            const result = await window.electronAPI.scrapeInfo()
            return await result
        },
        async scrapeSpecific(scrapeId) {
            const result = await window.electronAPI.scrapeSpecific(scrapeId)
            return await result
        },
        async getServiceInfo() {
            const result = await window.electronAPI.getServiceInfo()
            this.allRequests = await result
        },
        async getAllBikes() {
            const allBikes = await window.electronAPI.getInfo()
            this.allBikes = allBikes
        },
        updateBike(bike, tableName) {
            const { id, bike_name, bike_description, bike_slogan, image, gallery, brand, category, main_year, permis, rabla, gallery_image, gallery_description, gallery_title, is_gallery, is_popular, capacitate, vehicle_type, omologare, colors, display_model, colors_display } = bike
            const imagesArray = gallery.map(image => image);
            const price = JSON.stringify(bike.price).replace("[", "{").replace("]", "}")
            const old_price = JSON.stringify(bike.old_price).replace("[", "{").replace("]", "}")
            const updateBike = {
                id,
                bike_name,
                bike_description,
                bike_slogan,
                price,
                old_price,
                image,
                gallery: imagesArray,
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
            }
            console.log(updateBike)
            updateBike.permis = [...new Set(permis)]
            updateBike.colors = [...new Set(colors)]
            updateBike.omologare = [...new Set(omologare)]
            updateBike.colors_display = JSON.stringify(updateBike.colors_display).replace('"{', '{').replace('}"', '}').replace(/\\"/g, '"')
            window.electronAPI.updateBike(updateBike, tableName)
        },
        async deleteBike(id, tableName) {
            const response = await window.electronAPI.deleteBike({ id, tableName })
            return response
        },
        async backupDB() {
            const response = await window.electronAPI.backupDB()
            return response
        },
        async updateTable(tableName) {
            const response = await window.electronAPI.updateTable(tableName)
            return response
        },
        async uploadTable() {
            const response = await window.electronAPI.uploadTable()
            return response
        },
        async downloadTable(data) {
            const response = await window.electronAPI.downloadTable(data)
            return response
        },
        async saveNewTable(data) {
            const response = await window.electronAPI.saveNewTable(data)
            return response
        },
        async editTable(data) {
            const response = await window.electronAPI.editTable(data)
            return response
        },
        async markRequestAsActive(id) {
            await window.electronAPI.markRequestAsActive(id)
        },
        async markRequestAsInactive(id) {
            await window.electronAPI.markRequestAsInactive(id)
        },
        async deleteRequest(id) {
            await window.electronAPI.deleteRequest(id)
        },

    }
})