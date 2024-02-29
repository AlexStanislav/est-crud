import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
    state: () => ({
        isConnected: false,
        allBikes: {},
        allRequests: []
    }),
    actions: {
        async connect(data) {
            const isConnected = window.electronAPI.connectToDatabase(data)
            this.isConnected = await isConnected
        },
        async getServiceInfo(){
            const result = await window.electronAPI.getServiceInfo()
            this.allRequests = await result
        },
        async getAllBikes() {
            const allBikes = await window.electronAPI.getInfo()
            this.allBikes = allBikes
        },
        updateBike(bike, tableName) {
            const { id, bike_name, bike_description, bike_slogan, price, old_price, image, gallery, brand, category, main_year, permis, rabla, gallery_image, gallery_description, gallery_title, is_gallery, is_popular, capacitate } = bike
            const imagesArray = gallery.map(image => image);
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
                capacitate
            }
            console.log(updateBike)
            updateBike.permis = [...new Set(permis)]
            window.electronAPI.updateBike(updateBike, tableName)
        },
        async uploadTable() {
            const response = await window.electronAPI.uploadTable()
            return response
        },
        async saveNewTable(data) {
            const response = await window.electronAPI.saveNewTable(data)
            return response
        },
        async editTable(data){
            const response = await window.electronAPI.editTable(data)
            return response
        },
        async markRequestAsActive(id){
            await window.electronAPI.markRequestAsActive(id)
        },
        async markRequestAsInactive(id){
            await window.electronAPI.markRequestAsInactive(id)
        },
        async deleteRequest(id){
            await window.electronAPI.deleteRequest(id)
        },

    }
})