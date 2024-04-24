<template>
  <div class="home-view">
    <nav>
      <h2>
        Tabele
        <div class="actions-container">
          <Button
            icon="pi pi-plus"
            severity="success"
            @click="showNewTableDialog = true"
            title="Incarca tabel nou"
          ></Button>
          <Button
            icon="pi pi-download"
            severity="default"
            title="Descarca informatii"
            @click="showScrapeDialog = true"
          ></Button>
          <Button
            icon="pi pi-list"
            severity="info"
            title="Vezi log"
            @click="appStore.toggleScrapeLog(true)"
          ></Button>
          <Button
            icon="pi pi-refresh"
            severity="info"
            @click="refreshBikes()"
            title="Reincarca informatii tabele"
          ></Button>
        </div>
      </h2>
      <ul>
        <li
          v-for="brand in bikeBrands"
          :key="brand"
          @click="showCurrentBikes(brand)"
        >
          <div>
            {{ brand }}
          </div>
          <!-- <Button
            icon="pi pi-pencil"
            severity="warning"
            @click="editTable(brand)"
          /> -->
        </li>
      </ul>
    </nav>
    <main>
      <div class="loading-data" v-if="isLoading">
        <h1>Se incarca...</h1>
        <ProgressSpinner />
      </div>
      <DataTable
        v-else
        v-model:filters="globalFilters"
        removableSort
        :value="currentBikes"
        size="small"
        filterDisplay="menu"
        :globalFilterFields="[
          'bike_name',
          'price',
          'old_price',
          'capacitate',
          'category',
          'is_gallery',
          'main_year',
        ]"
      >
        <template #header>
          <InputText
            v-model="globalFilters['global'].value"
            placeholder="Cauta"
          />
        </template>
        <Column sortable field="bike_name" header="Nume">
          <template #filter="{ filterModel }">
            <InputText
              type="text"
              v-model="filterModel.value"
              class="p-column-filter"
            />
          </template>
        </Column>
        <Column sortable field="price" header="Pret in euro">
          <template #body="slotProps">
            {{ slotProps.data.price ? slotProps.data.price : "Gol" }}
          </template>
          <template #filter="{ filterModel }">
            <InputText
              type="text"
              v-model="filterModel.value"
              class="p-column-filter"
            />
          </template>
        </Column>
        <Column sortable field="old_price" header="Pret vechi">
          <template #body="slotProps">
            {{ slotProps.data.old_price ? slotProps.data.old_price : "Gol" }}
          </template>
          <template #filter="{ filterModel }">
            <InputText
              type="text"
              v-model="filterModel.value"
              class="p-column-filter"
            />
          </template>
        </Column>
        <Column sortable field="is_gallery" header="In slideshow">
          <template #filter="{ filterModel }">
            <InputText
              type="text"
              v-model="filterModel.value"
              class="p-column-filter"
            /> </template
        ></Column>
        <Column sortable field="capacitate" header="Capacitate">
          <template #body="slotProps">
            {{ slotProps.data.capacitate ? slotProps.data.capacitate : "Gol" }}
          </template>
          <template #filter="{ filterModel }">
            <InputText
              type="text"
              v-model="filterModel.value"
              class="p-column-filter"
            />
          </template>
        </Column>
        <Column sortable field="category" header="Categorie">
          <template #body="slotProps">
            {{ slotProps.data.category ? slotProps.data.category : "Gol" }}
          </template>
          <template #filter="{ filterModel }">
            <InputText
              type="text"
              v-model="filterModel.value"
              class="p-column-filter"
            />
          </template>
        </Column>
        <Column sortable field="main_year" header="An">
          <template #body="slotProps">
            {{ slotProps.data.main_year ? slotProps.data.main_year : "Gol" }}
          </template>
          <template #filter="{ filterModel }">
            <InputText
              type="text"
              v-model="filterModel.value"
              class="p-column-filter"
            />
          </template>
        </Column>
        <Column sortable field="rabla" header="Rabla">
          <template #body="slotProps">
            {{ slotProps.data.rabla ? slotProps.data.rabla : "Gol" }}
          </template>
          <template #filter="{ filterModel }">
            <InputText
              type="text"
              v-model="filterModel.value"
              class="p-column-filter"
            />
          </template>
        </Column>
        <Column sortable field="permis" header="Permis">
          <template #body="slotProps">
            {{
              slotProps.data.permis.length > 0
                ? slotProps.data.permis.join(", ")
                : "Gol"
            }}
          </template>
          <template #filter="{ filterModel }">
            <InputText
              type="text"
              v-model="filterModel.value"
              class="p-column-filter"
            />
          </template>
        </Column>
        <Column header="Actiuni">
          <template #body="slotProps">
            <div class="table-actions">
              <Button
                icon="pi pi-pencil"
                severity="warning"
                @click="editBike(slotProps.data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </main>
    <Dialog
      v-model:visible="showDialog"
      modal
      :header="currentBike.bike_name"
      style="min-width: 100vw; min-height: 100vh"
    >
      <section class="left-info">
        <h2>Detalii</h2>
        <div class="form-row">
          <FloatLabel>
            <InputText type="text" v-model="currentBike.bike_name" />
            <label>Nume</label>
          </FloatLabel>
          <FloatLabel>
            <Dropdown
              v-model="currentBike.brand"
              :options="brandOptions[currentBike['vehicle_type']]"
              placeholder="Marca"
              class="bike-column"
            />
            <label>Marca</label>
          </FloatLabel>
        </div>
        <div class="form-row">
          <FloatLabel>
            <InputText type="number" v-model="currentBike.price" />
            <label>Pret</label>
          </FloatLabel>
          <FloatLabel>
            <InputText type="number" v-model="currentBike.old_price" />
            <label>Pret vechi</label>
          </FloatLabel>
        </div>
        <div class="form-row">
          <FloatLabel>
            <Dropdown
              v-model="currentBike.category"
              :options="bikeCategories[currentBike['vehicle_type']]"
              class="bike-column"
              placeholder="Categorie"
            />
            <label>Categorie</label>
          </FloatLabel>
          <FloatLabel>
            <Dropdown
              v-model="currentBike.main_year"
              :options="yearOptions"
              class="bike-column"
              placeholder="An"
              optionLabel="name"
              optionValue="value"
            />
            <label>An</label>
          </FloatLabel>
        </div>
        <div class="form-row">
          <FloatLabel>
            <Dropdown
              v-model="currentBike.rabla"
              :options="rablaOptions"
              class="bike-column"
              placeholder="Eligibila Rabla"
              optionLabel="name"
              optionValue="value"
            />
            <label>Rabla</label>
          </FloatLabel>
          <FloatLabel>
            <MultiSelect
              v-model="permisValue"
              :options="permisOptions"
              optionLabel="name"
              optionValue="value"
              placeholder="Permis"
              display="chip"
              class="bike-column"
              @change="permisChange"
            ></MultiSelect>
            <label>Permis</label>
          </FloatLabel>
        </div>
        <div class="form-row">
          <FloatLabel>
            <Dropdown
              v-model="currentBike.capacitate"
              :options="capacityOptions()"
              class="bike-column"
              placeholder="Capacitate"
            />
            <label>Capacitate</label>
          </FloatLabel>
          <FloatLabel>
            <InputText type="text" v-model="currentBike.bike_slogan" />
            <label>Slogan</label>
          </FloatLabel>
        </div>
        <div class="form-row">
          <FloatLabel>
            <InputText type="text" v-model="currentBike.gallery_title" />
            <label>Titlu Slideshow</label>
          </FloatLabel>
          <FloatLabel>
            <InputText type="text" v-model="currentBike.gallery_description" />
            <label>Subtitlu Slideshow</label>
          </FloatLabel>
        </div>
        <div class="form-row">
          <FloatLabel>
            <Dropdown
              v-model="currentBike.vehicle_type"
              :options="[
                { name: 'Motociclete', value: 'bikes' },
                { name: 'Scutere', value: 'scooters' },
                { name: 'Atv', value: 'atv' },
                { name: 'SSV', value: 'ssv' },
              ]"
              placeholder="Tip vehicul"
              optionLabel="name"
              optionValue="value"
              class="bike-column"
            />
            <label>Tip vehicul</label>
          </FloatLabel>
        </div>
        <div class="form-row">
          <div class="form-column">
            <label>Exista in slideshow?</label>
            <ToggleButton
              v-model="currentBike.is_gallery"
              onLabel="Da"
              offLabel="Nu"
            />
          </div>
          <!-- <div class="form-column">
            <label>Exista in modele populare?</label>
            <ToggleButton
              v-model="currentBike.is_popular"
              onLabel="Da"
              offLabel="Nu"
            />
          </div> -->
        </div>
        <div class="form-row main-image">
          <h2>Imagine Slideshow</h2>
          <div class="form-column">
            <InputText
              type="text"
              v-model="currentBike.gallery_image"
              title="Imagine principala"
            />
            <Image class="preview-image" preview>
              <template #indicatoricon>
                <i class="pi pi-eye"></i>
              </template>
              <template #image>
                <i class="pi pi-eye"></i>
              </template>
              <template #preview>
                <img :src="currentBike.gallery_image" alt="preview" />
              </template>
            </Image>
          </div>
        </div>
        <div class="form-row main-image">
          <h2>Imagine principala</h2>
          <div class="form-column">
            <InputText
              type="text"
              v-model="currentBike.image"
              title="Imagine principala"
            />
            <Image class="preview-image" preview>
              <template #indicatoricon>
                <i class="pi pi-eye"></i>
              </template>
              <template #image>
                <i class="pi pi-eye"></i>
              </template>
              <template #preview>
                <img :src="currentBike.image" alt="preview" />
              </template>
            </Image>
          </div>
        </div>
      </section>
      <section class="right-info">
        <div class="gallery-column">
          <div class="gallery-header">
            <h2>Galerie</h2>
          </div>
          <div class="gallery-content">
            <InputGroup>
              <InputGroupAddon addonType="prepend" @click="addGalleryImage()">
                <i class="pi pi-plus"></i>
              </InputGroupAddon>
              <InputText type="text" v-model="newGalleryImage" />
            </InputGroup>
            <span
              class="gallery-row"
              v-for="image in currentBike.gallery"
              :key="image"
            >
              <InputText type="text" :value="image.replace('$http', 'http')" />
              <Image class="preview-image" preview>
                <template #indicatoricon>
                  <i class="pi pi-eye"></i>
                </template>
                <template #image>
                  <i class="pi pi-eye"></i>
                </template>
                <template #preview>
                  <img :src="image.replace('$http', 'http')" alt="preview" />
                </template>
              </Image>
              <i
                class="pi pi-times remove-gallery-image"
                @click="confirmDelete($event, image)"
              ></i>
            </span>
          </div>
        </div>
        <div class="description-column">
          <h2>Descriere</h2>
          <Textarea v-model="currentBike.bike_description" />
        </div>
      </section>
      <template #footer>
        <Button label="Salveaza" severity="success" @click="saveChanges()" />
      </template>
    </Dialog>
    <Dialog v-model:visible="showNewTableDialog" modal class="new-table-dialog">
      <template #header>
        <h1>Adaugare Tabel</h1>
      </template>

      <div class="form-row">
        <FloatLabel>
          <InputText type="text" v-model="newTable.name" />
          <label>Nume Tabel</label>
        </FloatLabel>
        <Dropdown
          v-model="newTable.type"
          :options="tableTypes"
          :option-label="'name'"
          placeholder="Tip Tabel"
        />
      </div>
      <div class="form-row table-example">
        <h2>Model Coloane Tabel</h2>
        <table>
          <tr>
            <td>A</td>
            <td>B</td>
            <td>C</td>
            <td>D</td>
            <td>E</td>
            <td>F</td>
            <td>G</td>
            <td>H</td>
            <td>I</td>
          </tr>
          <tr>
            <td
              v-for="(column, index) of tableExample.slice(0, 9)"
              :key="index"
            >
              {{ column }}
            </td>
          </tr>
        </table>
        <table>
          <tr>
            <td>J</td>
            <td>K</td>
            <td>L</td>
            <td>M</td>
            <td>N</td>
            <td>O</td>
            <td>P</td>
            <td>Q</td>
            <td>R</td>
            <td>S</td>
          </tr>
          <tr>
            <td
              v-for="(column, index) of tableExample.slice(9, 19)"
              :key="index"
            >
              {{ column }}
            </td>
          </tr>
        </table>
      </div>
      <div class="form-row">
        <InputText
          type="text"
          placeholder="Nume fisier incarcat..."
          v-model="currentTableFilename"
          readonly
        />
      </div>
      <div class="form-row">
        <Button
          label="Incarca XLS"
          severity="warning"
          icon="pi pi-upload"
          @click="uploadXLS()"
        />
        <!-- <Button label="Genereaza XLS Exemplu" severity="info" icon="pi pi-file" @click="generateXLS()" /> -->
      </div>
      <template #footer>
        <Button label="Salveaza" severity="success" @click="saveNewTable()" />
      </template>
    </Dialog>
    <Dialog
      v-model:visible="showTableEditDialog"
      modal
      class="table-edit-dialog"
    >
      <template #header>
        <h2>Editeaza Coloana tabel</h2>
      </template>
      <div class="form-row">
        <Dropdown
          v-model="currentTable.brand"
          :options="brandOptions[currentTable['name'].split('_')[1]]"
          class="bike-column"
          placeholder="Marca"
        />
        <FloatLabel>
          <InputText type="text" v-model="currentTable.vehicle_type" />
          <label>Tip vehicul {{ currentTable.name }}</label>
        </FloatLabel>
      </div>
      <div class="form-row">
        <Button
          severity="success"
          icon="pi pi-save"
          label="Salveaza"
          @click="saveTableChanges()"
        />
      </div>
    </Dialog>
    <Dialog
      v-model:visible="appStore.showScrapeLog"
      modal
      class="scrape-log-dialog"
      style="min-width: 100vw; min-height: 100vh"
    >
      <template #header>
        <h1>Scrape Log</h1>
      </template>
      <div class="scrape-log">
        <pre>{{ appStore.scrapeLog }}</pre>
      </div>
    </Dialog>
    <Dialog v-model:visible="showScrapeDialog" modal class="scrape-dialog" header="Descarca informatii vehicule">
      <Button
        icon="pi pi-download"
        :label="`Descarca ${scraper.replace('scrape-', '').replace('-snowmobiles', ' snowmobile') }`"
        v-for="scraper of scrapeList"
        :key="scraper"
        @click="scrapeSpecific(scraper)">
      </Button>
      <Button icon="pi pi-download" label="Descarca toate" @click="scrapeInfo()"></Button>
    </Dialog>
    <ConfirmPopup></ConfirmPopup>
    <Toast></Toast>
  </div>
</template>
<script setup>
import ProgressSpinner from "primevue/progressspinner";
import { VueElement, onMounted, ref, watch } from "vue";
import { useAppStore } from "../store/app.store";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import FloatLabel from "primevue/floatlabel";
import InputGroup from "primevue/inputgroup";
import InputGroupAddon from "primevue/inputgroupaddon";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Dialog from "primevue/dialog";
import Textarea from "primevue/textarea";
import ConfirmPopup from "primevue/confirmpopup";
import ToggleButton from "primevue/togglebutton";
import Toast from "primevue/toast";
import Image from "primevue/image";
import Dropdown from "primevue/dropdown";
import MultiSelect from "primevue/multiselect";
import { FilterMatchMode } from "primevue/api";

const toast = useToast();
const confirm = useConfirm();
const appStore = useAppStore();
const bikeBrands = ref([]);
const currentBikes = ref();
const currentBike = ref({});
const showDialog = ref(false);
const showNewTableDialog = ref(false);
const showTableEditDialog = ref(false);
const currentBrand = ref("");
const newGalleryImage = ref("");
const currentTableFilename = ref("");
const isLoading = ref(true);
const permisValue = ref();
const permisOptions = ref([
  { name: "A", value: "A" },
  { name: "A1", value: "A1" },
  { name: "A2", value: "A2" },
  { name: "B", value: "B" },
]);

const showScrapeDialog = ref(false);

const scrapeList = [
  "scrape-motoboom",
  "scrape-aspgroup",
  "scrape-atvrom",
  "scrape-beneli",
  "scrape-beta",
  "scrape-kymco",
  "scrape-piaggio",
  "scrape-polaris",
  "scrape-polaris-snowmobiles",
  "scrape-segway",
  "scrape-suzuki",
  "scrape-swm",
  "scrape-sym",
  "scrape-vespa",
  "scrape-yamaha",
];

const bikeCategories = ref({
  bikes: ["Sport", "Naked", "Touring", "Adventure", "Dual Sport", "Cruiser"],
  scooters: ["Sport", "Utility", "Copii"],
  atv: ["Sport", "Utility", "Copii", "Touring"],
  snowmobiles: ["Utility", "Trail", "Copii", "Mountain", "Crossover"],
});

const rablaOptions = ref([
  { name: "Da", value: true },
  { name: "Nu", value: false },
]);

const brandOptions = ref({
  bikes: [],
  scooters: [],
  atv: [],
  ssv: [],
  snowmobiles: [],
});

const yearOptions = ref([
  { name: "2024", value: 2024 },
  { name: "2023", value: 2023 },
  { name: "2022", value: 2022 },
  { name: "2021", value: 2021 },
  { name: "2020", value: 2020 },
]);

const tableExample = ref([
  "bike_name",
  "bike_slogan",
  "bike_description",
  "main_year",
  "price",
  "old_price",
  "currency",
  "image",
  "gallery",
  "category",
  "rabla",
  "permis",
  "capacitate",
  "is_gallery",
  "gallery_image",
  "gallery_title",
  "gallery_description",
  "is_popular",
  "brand",
  "vehicle_type",
]);

const capacityOptions = () => {
  const numArray = [];
  let i = 25;
  while (i <= 5000) {
    numArray.push(i);
    i += 25;
  }
  return numArray;
};

const scrapeInfo = async () => {
  appStore.toggleScrapeLog(true);
  await appStore.scrapeInfo();
};

const scrapeSpecific = async (scrapeId) => {
  showScrapeDialog.value = false;
  appStore.toggleScrapeLog(true);
  await appStore.scrapeSpecific(scrapeId);
};

const getBikeBrands = async () => {
  for (const brand of Object.keys(appStore.allBikes)) {
    console.log(brand);
    if (brand.includes("_atv")) {
      brandOptions.value["atv"].push(brand.replace(/_\w+/g, ""));
    }
    if (brand.includes("_ssv")) {
      brandOptions.value["ssv"].push(brand.replace(/_\w+/g, ""));
    }
    if (brand.includes("_bikes")) {
      brandOptions.value["bikes"].push(brand.replace(/_\w+/g, ""));
    }
    if (brand.includes("_scooters")) {
      brandOptions.value["scooters"].push(brand.replace(/_\w+/g, ""));
    }
    if (brand.includes("_snowmobiles")) {
      brandOptions.value["snowmobiles"].push(brand.replace(/_\w+/g, ""));
    }
  }

  brandOptions.value["atv"] = brandOptions.value["atv"].filter((value) => {
    if (value !== "aspgroup") {
      return value;
    }
  });

  brandOptions.value["atv"].push("linhai");
  brandOptions.value["atv"].push("tgb");
  brandOptions.value["atv"].push("argo");
};

const globalFilters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  bike_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  price: { value: null, matchMode: FilterMatchMode.CONTAINS },
  old_price: { value: null, matchMode: FilterMatchMode.CONTAINS },
  is_gallery: { value: null, matchMode: FilterMatchMode.CONTAINS },
  capacitate: { value: null, matchMode: FilterMatchMode.CONTAINS },
  main_year: { value: null, matchMode: FilterMatchMode.CONTAINS },
  category: { value: null, matchMode: FilterMatchMode.CONTAINS },
  rabla: { value: null, matchMode: FilterMatchMode.CONTAINS },
  permis: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

const newTable = ref({
  name: "",
  type: "",
});

const currentTable = ref({
  name: "",
  brand: "",
  vehicle_type: "",
});

const tableTypes = ref([
  { name: "Motociclete", value: "bikes" },
  { name: "Scutere", value: "scooters" },
  { name: "ATV", value: "atv" },
  { name: "SSV", value: "ssv" },
  { name: "Snowmobile", value: "snowmobiles" },
]);

const currentDialogImage = ref("");

const permisChange = () => {
  currentBike.value.permis = [];
  if (permisValue.value.length > 0) {
    for (const permis of permisValue.value) {
      currentBike.value.permis.push(permis);
    }
  }
};

const saveNewTable = async () => {
  const { name, type } = newTable.value;
  const response = await appStore.saveNewTable({ name, type: type.value });
  console.log(response);
};

const uploadXLS = async () => {
  const result = await appStore.uploadTable();
  if (result.success) {
    currentTableFilename.value = result.fileName;
    toast.add({
      severity: "success",
      summary: "Success",
      detail: `Tabel incarcat`,
      life: 3000,
    });
  } else {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: `Tabelul nu a putut fi incarcat`,
      life: 3000,
    });
  }
};

const saveChanges = async () => {
  await appStore.updateBike(currentBike.value, currentBrand.value);
  toast.add({
    severity: "success",
    summary: "Success",
    detail: `Modificari salvate`,
    life: 3000,
  });
  showDialog.value = false;
  setTimeout(() => {
    refreshBikes();
  }, 50);
};

const editTable = (brand) => {
  showTableEditDialog.value = true;
  currentTable.value.name = brand;
};

const saveTableChanges = async () => {
  const { name, brand, vehicle_type } = currentTable.value;
  const response = await appStore.editTable({
    tableName: name,
    info: { brand, vehicle_type },
  });
  if (response) {
    currentTable.value.brand = "";
    currentTable.vehicle_type = "";
    toast.add({
      severity: "success",
      summary: "Success",
      detail: `Modificari salvate`,
      life: 3000,
    });
  }
};

const editBike = (bike) => {
  getBikeBrands();
  showDialog.value = true;
  currentBike.value = { ...bike };
  permisValue.value = bike.permis;
  if (currentBike.value.capacitate) {
    currentBike.value.capacitate =
      Math.round(parseInt(currentBike.value.capacitate) / 25) * 25;
  }
};

const showCurrentBikes = (brand) => {
  localStorage.setItem("currentBrand", brand);
  currentBrand.value = brand;
  currentBikes.value = appStore.allBikes[brand];
};

const refreshBikes = async () => {
  await appStore.getAllBikes();
  if (appStore.allBikes) {
    bikeBrands.value = Object.keys(appStore.allBikes);
    bikeBrands.value.sort();
    currentBrand.value = localStorage.getItem("currentBrand")
      ? localStorage.getItem("currentBrand")
      : bikeBrands.value[0];
    currentBikes.value = appStore.allBikes[currentBrand.value];

    toast.add({
      severity: "success",
      summary: "Success",
      detail: `Tabele actualizate`,
      life: 3000,
    });
    isLoading.value = false;
  }
};

const confirmDelete = (event, image) => {
  confirm.require({
    target: event.currentTarget,
    message: "Esti sigur ca vrei sa stergi?",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Da",
    rejectLabel: "Nu",
    accept: () => {
      removeImage(image);
    },
  });
};

const addGalleryImage = () => {
  if (newGalleryImage.value) {
    currentBike.value.gallery.push(newGalleryImage.value);
    newGalleryImage.value = "";
  }
};

const removeImage = (image) => {
  const index = currentBike.value.gallery.indexOf(image);
  currentBike.value.gallery.splice(index, 1);
};

onMounted(async () => {
  getBikeBrands();
  refreshBikes();
});

watch(currentBike, () => {
  console.log("currentBike.value", currentBike.value);
  currentDialogImage.value = currentBike.value ? currentBike.value.image : "";
  currentBike.permis = permisValue.value;
  showDialog.value = true;
});
</script>
<style lang="scss">
/* Using original class names and refactoring the code to use SASS features */

/* Using original class names */
.home-view {
  display: flex;
  gap: 2rem;
  position: relative;
  z-index: 5;
  background: var(--surface-0);
}

/* Using original class names */
.table-actions {
  display: flex;
  gap: 1rem;
  .p-button {
    width: 3rem;
  }
}

/* Using original class names */
nav {
  flex: 1;
  padding: 0 1rem;
  background: var(--surface-50);
  position: relative;
  z-index: 1;

  h2 {
    text-align: center;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--surface-300);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  ul {
    list-style: none;
    padding: 0;

    li {
      div {
        display: flex;
        align-items: center;
        flex: 1;
      }
      .p-button {
        flex: 0.2;
      }

      display: flex;
      flex-flow: row nowrap;
      margin: 0.25rem 0;
      padding: 0.5rem;
      border-radius: 6px;
      text-transform: uppercase;

      &:hover {
        cursor: pointer;
        background: var(--blue-700);
      }
    }
  }
}

.loading-data {
  display: flex;
  flex-flow: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100vh;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 10;
  background: var(--surface-50);
}

/* Using original class names */
main {
  flex: 6;
}

/* Using original class names */
.p-dialog {
  border-radius: 0;

  & .p-dialog-footer {
    border-radius: 0;
    padding-top: 1rem;
  }

  & .p-dialog-content {
    display: flex;
    height: 100vh;
    gap: 1rem;
  }
}

.bike-column {
  width: 100%;
}

/* Using original class names */
.left-info {
  width: 35vw;
}

/* Using original class names */
.right-info {
  width: 65vw;
  display: flex;
  flex-flow: column;
  gap: 1rem;

  /* Using original class names */
  .gallery-column {
    width: 100%;
    & .p-input-icon-left {
      margin: 0.5rem 0;
    }
  }
  .gallery-content {
    height: 33vh;
    overflow: auto;
    .p-inputgroup {
      margin-bottom: 0.5rem;
    }
    .p-inputgroup-addon {
      background: var(--green-500);
      color: #fff;
      cursor: pointer;
    }
    .p-inputgroup-addon:active {
      background: var(--green-700);
    }
  }

  /* Using original class names */
  .gallery-row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
}

/* Using original class names */
.form-row {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

/* Using original class names */
.form-column {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-right: 2rem;
}

/* Using original class names */
.p-float-label,
.p-inputtext,
.p-input-icon-left {
  width: 100%;
}

/* Using original class names */
.gallery-header {
  display: flex;
  gap: 2rem;
  align-items: center;

  & .p-button {
    width: 10vw;
  }
}

.p-input-icon-left {
  display: flex;
  align-items: center;
}

.main-image {
  flex-flow: column;
  h2 {
    margin: 0;
  }
  .form-column {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
}
.preview-image {
  background: var(--green-600);
  padding: 0.25rem;
  border-radius: 4px;
}

/* Using original class names */
.pi-eye,
.pi-image {
  cursor: pointer;
}

/* Using original class names */
.pi-times {
  cursor: pointer;
  margin-left: 0.5rem;
  background: var(--red-500);
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.7rem;
}

.actions-container {
  width: fit-content;
  display: flex;
  flex-flow: row nowrap;
  gap: 0.5rem;
  .p-button {
    width: 2.5rem;
  }
}

/* Using original class names */
.p-inputtextarea {
  resize: none;
  text-align: justify;
  text-justify: distribute;
  line-height: 34px;
  height: 35vh;
}

/* Using original class names */
.img-container {
  width: 25vw;
  border-radius: 6px;

  & img {
    width: 50%;
    height: auto;
  }
}

.new-table-dialog {
  width: 60vw;
  height: 70vh;
  border-radius: 6px;
  .p-dialog-content {
    display: flex;
    flex-flow: column;
  }
  .form-row {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
    height: fit-content;
  }
  .p-dropdown {
    width: 100%;
  }
}

.table-edit-dialog {
  width: fit-content;
  height: 15rem;
  .form-row {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
    height: fit-content;
  }
}

.table-example {
  display: flex;
  flex-flow: column;
  table {
    margin-bottom: 1rem;
    td {
      text-align: center;
      border: 1px solid var(--surface-300);
      width: 5rem;
    }
  }
}
/* Updated media query to reflect the changes made to .left-info */
@media screen and (max-width: 1366px) {
  .p-dialog {
    .p-inputtext {
      font-size: 0.8rem;
    }
    h2 {
      font-size: 1.3rem;
      margin: 0.5rem 0;
    }
    .p-inputtextarea {
      height: 30vh;
    }
    .gallery-column {
      .p-button {
        width: 12vw;
        font-size: 0.8rem;
        padding: 0.4rem;
      }
    }
    .gallery-content {
      height: 34vh;
    }
  }
  .left-info {
    flex: 5;
    width: 100%;
    .form-row {
      margin: 1.8rem 0;
    }
  }
  .right-info {
    flex: 5;
  }
  .new-table-dialog {
    width: 90vw;
    height: 90vh;
    .p-dialog-content {
      display: flex;
      flex-flow: column;
    }
    .form-row {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
      height: fit-content;
    }
    .p-dropdown {
      width: 100%;
    }
  }
}

.scrape-dialog {
  height: 50vh;
  .p-dialog-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
</style>