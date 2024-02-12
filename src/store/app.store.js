import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
    state: () => ({
        isConnected: false,
        allBikes: {}
    }),
    actions: {
        connect(data) {
            const isConnected = window.electronAPI.connectToDatabase(data)
            this.isConnected = isConnected.data
        },
        async getAllBikes() {
            const allBikes = await window.electronAPI.getInfo()
            this.allBikes = allBikes
        },
        updateBike(bike, tableName) {
            const { id, bike_name, bike_description, bike_slogan, price, old_price, image, gallery, brand, category, main_year, permis, rabla, gallery_image, gallery_description, gallery_title, is_gallery, is_popular, capacitate } = bike
            const imagesArray = gallery.map(image => image);
            let permisArray;
            if (typeof permis === "string") {
                if (permis !== "") {
                    permisArray = permis.split(',')
                } else {
                    permisArray = null
                }
            } else {
                if (permis !== "") {
                    permisArray = permis.map(permis => permis)
                } else {
                    permisArray = null
                }
            }
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
                permis: permisArray,
                rabla,
                gallery_image,
                gallery_description,
                gallery_title,
                is_gallery,
                is_popular,
                capacitate
            }
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
        }

    }
})