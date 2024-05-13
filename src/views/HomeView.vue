<template>
  <div class="home-view">
    <nav>
      <h2>
        Tabele
        <div class="actions-container">
          <Button
            icon="pi pi-table"
            severity="success"
            @click="showNewTableDialog = true"
            title="Incarcare/Descarcare XLS"
          ></Button>
          <Button
            icon="pi pi-download"
            severity="default"
            title="Descarca informatii modele"
            @click="showScrapeDialog = true"
          ></Button>
          <Button
            icon="pi pi-list"
            severity="info"
            title="Vezi progress descarcare"
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
          <label>Coloane: &nbsp;</label>
          <MultiSelect
            :modelValue="selectedColumns"
            :options="columns"
            optionLabel="header"
            @update:modelValue="onColumnToggle"
            display="chip"
            placeholder="Selecteaza coloane"
          />
        </template>
        <Column sortable header="ID">
          <template #body="slotProps">
            {{ slotProps.index + 1 }}
          </template>
        </Column>
        <Column
          v-for="col of selectedColumns"
          :key="col.field"
          :field="col.field"
          :header="col.header"
          :sortable="col.sortable"
        >
          <template #body="slotProps">
            {{ parseColumnData(slotProps.data, col) }}
          </template>
          <template #filter="{ filterModel }">
            <InputText
              type="text"
              v-model="filterModel.value"
              class="p-column-filter"
            />
          </template>
        </Column>
        <!-- <Column sortable field="bike_name" header="Nume">
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
            {{ displayPrice(slotProps.data.price) }}
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
            {{ displayPrice(slotProps.data.old_price) }}
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
        </Column> -->
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
          <span class="price-display" v-if="currentBike.price !== null">
            <FloatLabel
              v-for="(price, index) in currentBike.price"
              :key="index"
            >
              <InputText type="text" v-model="currentBike.price[index]" />
              <label v-if="index === 0">Pret</label>
            </FloatLabel>
          </span>
          <span class="price-display" v-else>
            <FloatLabel>
              <InputText type="text" v-model="currentBike.price" />
              <label>Pret</label>
            </FloatLabel>
          </span>
          <span class="price-display" v-if="currentBike.old_price !== null">
            <FloatLabel
              v-for="(price, index) in currentBike.old_price"
              :key="index"
            >
              <InputText type="text" v-model="currentBike.old_price[index]" />
              <label v-if="index === 0">Pret vechi</label>
            </FloatLabel>
          </span>
          <span class="price-display" v-else>
            <FloatLabel>
              <InputText type="text" v-model="currentBike.old_price" />
              <label>Pret vechi</label>
            </FloatLabel>
          </span>
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
          <FloatLabel>
            <MultiSelect
              v-model="omologareValue"
              :options="omologareOptions"
              placeholder="Omlogare"
              display="chip"
              class="bike-column"
              @change="omologareChange"
            ></MultiSelect>
            <label>Omologare</label>
          </FloatLabel>
        </div>
        <div class="form-row form-toggles">
          <div class="form-column">
            <label>Exista in slideshow?</label>
            <ToggleButton
              v-model="currentBike.is_gallery"
              onLabel="Da"
              offLabel="Nu"
            />
          </div>
          <div class="form-column">
            <label>Apare pe site?</label>
            <ToggleButton
              v-model="currentBike.display_model"
              onLabel="Da"
              offLabel="Nu"
            />
          </div>
          <Button
            severity="warning"
            icon="pi pi-pencil"
            label="Editeaza culori"
            @click="showEditColorsDialog = true"
          />
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
              <InputText
                type="text"
                :value="image.replace('$http', 'http')"
                readonly
              />
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
      <Dialog
        v-model:visible="showEditColorsDialog"
        modal
        style="max-width: 55vw; height: fit-content"
        class="edit-colors-dialog"
      >
        <template #header>
          <h3>
            Editeaza Culori
            <Button
              icon="pi pi-question-circle"
              class="color-help-button"
              @click="showColorsHelp = true"
            />
            <Dialog
              class="color-help"
              v-model:visible="showColorsHelp"
              :style="{ width: '40vw', height: '40vh' }"
            >
              <p>
                Culorile se salveaza asa: <br />
                Nume Culoare => Valoare Culoare
              </p>
              <p>
                Valoarea culorii este sub forma hexazecimala pentru a o putea
                afisa pe site <br />
                Valorile HEX variaza de la 000000 la FFFFFF si se imparte in 3
                pentru fiecare valoare de RGB <br />
                Culorile intunecate au valorea mai mica, iar cele mai luminoase
                au valoare mai mare <br />
                Eg: Rosu => ff0000, Verde => 00ff00, Albastru => 0000ff
              </p>
              <p>
                Se pot introduce mai multe valori HEX pentru o singura culoare
                <br />
                Eg: yellow-black => ffff00,000000
              </p>
            </Dialog>
          </h3>
        </template>
        <Button
          severity="info"
          icon="pi pi-plus"
          @click="addColor()"
          title="Adauga culoare noua"
        />
        <ul class="edit-colors-list">
          <li v-for="(color, mainIndex) in currentBike.colors" :key="mainIndex">
            <div class="edit-color-name">
              <span class="edit-color-label">Nume culoare: </span
              ><InputText
                class="edit-color-input"
                v-model="currentBike.colors[mainIndex]"
                :readonly="canChangeColorName"
              />
              <Button
                v-if="canChangeColorName"
                severity="warning"
                icon="pi pi-pencil"
                @click="editColorName(mainIndex)"
                title="Editeaza nume culoare"
              />
              <Button
                v-else
                severity="success"
                icon="pi pi-check"
                @click="saveColorName(currentBike.colors[mainIndex], mainIndex)"
              />
            </div>
            <div class="color-picker-container">
              <span class="edit-color-label">Culoare: </span>
              <span
                class="color-picker-wrapper"
                v-if="Array.isArray(colorModel[color])"
              >
                <span
                  v-for="(element, index) in colorModel[color]"
                  :key="index"
                >
                  <ColorPicker
                    v-model="colorModel[color][index]"
                    format="hex"
                  />
                </span>
              </span>
              <span class="color-picker-wrapper" v-else>
                <ColorPicker v-model="colorModel[color]" format="hex" />
              </span>
              <Button
                class="color-picker-button"
                severity="info"
                icon="pi pi-plus"
                @click="addColorShade(mainIndex)"
              />
            </div>
            <div>
              <span class="edit-color-label">Valoare HEX: </span>
              <InputText
                class="edit-color-input"
                v-model="colorModel[color]"
                @input="handleColorModelChange($event, color)"
              />
            </div>
            <Button
              severity="danger"
              label="Sterge culoare"
              @click="removeColor(index, color)"
            />
          </li>
        </ul>
        <template #footer>
          <Button severity="success" label="Salveaza" @click="saveColors()" />
        </template>
      </Dialog>
    </Dialog>
    <Dialog v-model:visible="showNewTableDialog" modal class="new-table-dialog">
      <template #header>
        <h1>Adaugare Tabel</h1>
      </template>
      <div class="download-table">
        <h2>Descarca Tabel</h2>
        <div class="form-row">
          <Dropdown
            v-model="tableToDownload"
            :options="bikeBrands"
            placeholder="Selecteaza Tabel"
          />
        </div>
        <div class="form-row">
          <Button
            label="Descarca Tabel"
            severity="info"
            @click="downloadTable()"
          />
        </div>
      </div>
      <div class="update-table">
        <h2>Actualizeaza Tabel</h2>
        <div class="form-row">
          <Dropdown
            v-model="tableToUpdate"
            :options="bikeBrands"
            placeholder="Selecteaza Tabel"
          />
        </div>
        <div class="form-row">
          <InputText
            type="text"
            v-model="tableToUpdateName"
            placeholder="Nume fisier incarcat..."
            readonly
          />
        </div>
        <div class="form-row">
          <Button
            label="Selecteaza Fisier"
            severity="warning"
            icon="pi pi-file"
            @click="uploadXLSUpdate()"
          />
        </div>
        <div class="form-row">
          <Button
            label="Actualizeaza Tabel"
            severity="info"
            @click="updateTable()"
          />
        </div>
      </div>
      <div class="upload-table">
        <h2>Incarca Tabel Nou</h2>
        <div class="form-row">
          <FloatLabel>
            <InputText type="text" v-model="newTable.name" />
            <label>Nume Tabel Nou</label>
          </FloatLabel>
          <Dropdown
            v-model="newTable.type"
            :options="tableTypes"
            :option-label="'name'"
            placeholder="Tip Tabel"
          />
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
            label="Selecteaza Fisier"
            severity="warning"
            icon="pi pi-file"
            @click="uploadXLS()"
          />
        </div>
        <div class="form-row">
          <Button
            label="Incarca Tabel"
            severity="info"
            @click="saveNewTable()"
          />
        </div>
      </div>
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
    <Dialog
      v-model:visible="showScrapeDialog"
      modal
      class="scrape-dialog"
      header="Descarca informatii vehicule"
    >
      <Button
        icon="pi pi-download"
        :label="`Descarca ${scraper
          .replace('scrape-', '')
          .replace('-snowmobiles', ' snowmobile')
          .replace('-bikes', ' motociclete')
          .replace('-atv', ' atv')}`"
        v-for="scraper of scrapeList"
        :key="scraper"
        @click="scrapeSpecific(scraper)"
      >
      </Button>
      <Button
        icon="pi pi-download"
        label="Descarca toate"
        @click="scrapeInfo()"
      ></Button>
    </Dialog>
    <ConfirmPopup></ConfirmPopup>
    <Toast></Toast>
  </div>
</template>
<script setup>
import ProgressSpinner from "primevue/progressspinner";
import { VueElement, computed, onMounted, ref, watch } from "vue";
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
import ColorPicker from "primevue/colorpicker";
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

const columns = ref([
  { field: "bike_name", header: "Nume", sortable: true },
  { field: "price", header: "Pret", sortable: true },
  { field: "old_price", header: "Pret vechi", sortable: true },
  { field: "capacitate", header: "Capacitate", sortable: true },
  { field: "category", header: "Categorie", sortable: true },
  { field: "rabla", header: "Rabla", sortable: true },
  { field: "permis", header: "Permis", sortable: true },
  { field: "display_model", header: "Apare pe site", sortable: true },
  { field: "is_gallery", header: "In slideshow", sortable: true },
  { field: "vehicle_type", header: "Tip Vehicul", sortable: true },
  { field: "main_year", header: "An", sortable: true },
]);

const selectedColumns = ref(columns.value);

const onColumnToggle = (val) => {
  selectedColumns.value = columns.value.filter((col) => val.includes(col));
};

const parseColumnData = (data, col) => {
  if (col.field === "rabla") {
    return data[col.field] ? "Da" : "Nu";
  }
  if (col.field === "price" || col.field === "old_price") {
    const price = data[col.field];
    if (Array.isArray(price)) {
      if (price[0] !== null) {
        if (typeof price[0] === "string") {
          return price[0].replace(/[.,\s]/g, "");
        } else {
          return price[0];
        }
      } else {
        return null;
      }
    }
  }

  return data[col.field];
};

const omologareValue = ref();
const omologareOptions = ref([]);

const tableToDownload = ref("");
const tableToUpdate = ref("");
const tableToUpdateName = ref("");

const showScrapeDialog = ref(false);

const scrapeList = [
  "scrape-aprilia-bikes",
  "scrape-motoboom-bikes",
  "scrape-motoboom-atv",
  "scrape-aspgroup",
  "scrape-atvrom",
  "scrape-beneli",
  "scrape-beta",
  "scrape-kymco",
  "scrape-motoguzzi",
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
  bikes: [
    "Sport",
    "Naked",
    "Touring",
    "Adventure",
    "Dual Sport",
    "Cruiser",
    "Scrambler",
    "Bobber",
    "Children",
  ],
  scooters: ["Sport", "Utility", "Children"],
  atv: ["Sport", "Utility", "Children", "Touring"],
  snowmobiles: ["Utility", "Trail", "Children", "Mountain", "Crossover"],
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

const displayPrice = (price) => {
  if (Array.isArray(price)) {
    if (price[0] !== null) {
      if (typeof price[0] === "string") {
        return price[0].replace(/[.,\s]/g, "");
      } else {
        return price[0];
      }
    } else {
      return "Gol";
    }
  }
};

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

const getBikeOmologare = (bike) => {
  if (bike.omologare !== null && bike.omologare !== "undefined") {
    const omologareString = bike.omologare.replace("{", "[").replace("}", "]");
    omologareValue.value = JSON.parse(omologareString);
  }
};

const getBikeBrands = async () => {
  for (const brand of Object.keys(appStore.allBikes)) {
    if (brand.includes("_atv")) {
      brandOptions.value["atv"].push(brand.replace(/_\w+/g, ""));
    }
    if (brand.includes("_ssv")) {
      brandOptions.value["ssv"].push(brand.replace(/_\w+/g, ""));
    }
    if (brand.includes("_bikes")) {
      if (brand.includes("royal_enfield")) {
        brandOptions.value["bikes"].push("royal_enfield");
      } else {
        brandOptions.value["bikes"].push(brand.replace(/_\w+/g, ""));
      }
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

const omologareChange = () => {
  currentBike.value.omologare = [];
  if (omologareValue.value.length > 0) {
    for (const omologare of omologareValue.value) {
      currentBike.value.omologare.push(omologare);
    }
  }
};

const downloadTable = async () => {
  const result = await appStore.downloadTable(tableToDownload.value);
  if (result.success) {
    toast.add({
      severity: "success",
      summary: "Success",
      detail: `Tabel descarcat`,
      life: 3000,
    });
  } else {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: `Tabelul nu a putut fi descarcat`,
      life: 3000,
    });
  }
};

const saveNewTable = async () => {
  const { name, type } = newTable.value;
  const response = await appStore.saveNewTable({ name, type: type.value });
  console.log(response);
};

const uploadXLSUpdate = async () => {
  const result = await appStore.uploadTable();
  if (result.success) {
    tableToUpdateName.value = result.fileName;
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

const updateTable = async () => {
  const result = await appStore.updateTable(tableToUpdate.value);
  if (result.success) {
    toast.add({
      severity: "success",
      summary: "Success",
      detail: `Tabel actualizat`,
      life: 3000,
    });
    showNewTableDialog.value = false;
    tableToUpdateName.value = "";
    refreshBikes();
  }
  if (!result.success) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: `Tabelul nu a putut fi actualizat`,
      life: 3000,
    });
  }
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

const showEditColorsDialog = ref(false);
const showColorsHelp = ref(false);
const colorModel = ref({});

const editBike = (bike) => {
  getBikeBrands();
  showDialog.value = true;
  currentBike.value = { ...bike };
  let permisArr = [];
  currentBike.value.permis.forEach((permis) => {
    let permisValue = permis.replace(/\'/g, "");
    permisArr.push(permisValue);
  });
  permisValue.value = permisArr;
  currentBike.value.colors_display = bike.colors_display;

  if (currentBike.value.colors_display !== null) {
    console.log(currentBike.value.colors_display);
    colorModel.value = JSON.parse(currentBike.value.colors_display);
  } else {
    colorModel.value = {};
  }

  if (currentBike.value.capacitate) {
    currentBike.value.capacitate =
      Math.round(parseInt(currentBike.value.capacitate) / 25) * 25;
  }
  if (bike.colors === null) {
    bike.colors = [];
  }

  omologareOptions.value = ["t3b", "l7e"];

  if (Array.isArray(currentBike.value.price)) {
    let priceArr = []
    currentBike.value.price.forEach((price) => {
      price = price.replace(/[.,\s]/g, "");
      priceArr.push(price)
    });
    currentBike.value.price = priceArr
  } 

  getBikeOmologare(currentBike.value);
};

const handleColorModelChange = (event, index) => {
  if (typeof colorModel.value[index] === "string") {
    if (colorModel.value[index].includes(",")) {
      colorModel.value[index] = colorModel.value[index].split(",");
    }
  }
};
const currentColorName = ref("");
const canChangeColorName = ref(true);
const editColorName = (index) => {
  canChangeColorName.value = !canChangeColorName.value;
  currentColorName.value = currentBike.value.colors[index];
};

const saveColorName = (colorName, index) => {
  const colorDisplay = JSON.parse(currentBike.value.colors_display);
  const colorDisplayValue = colorDisplay[currentColorName.value];
  colorModel.value[colorName] = colorDisplayValue;
  colorDisplay[colorName] = colorDisplayValue;

  delete colorDisplay[currentColorName.value];
  delete colorModel.value[currentColorName.value];

  currentBike.value.colors_display = JSON.stringify(colorDisplay);
  canChangeColorName.value = !canChangeColorName.value;
};

const addColorShade = (index) => {
  const color = currentBike.value.colors[index];
  if (color === "") {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: `Introdu un nume pentru culoare!`,
      life: 3000,
    });
  }

  if (colorModel.value[color] === undefined) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: `Introdu sau alege o valoare HEX pentru culoare!`,
      life: 3000,
    });
  } else {
    const colorArr = [];
    colorArr.push(colorModel.value[color]);
    colorArr.push("");
    colorModel.value[color] = colorArr;
    console.log(colorModel.value);
    console.log(currentBike.value.colors);
    console.log(currentBike.value.colors_display);
  }
};

const addColor = () => {
  if (currentBike.value.colors === null) {
    currentBike.value.colors = [""];
  } else {
    currentBike.value.colors.push("");
  }
};

const removeColor = (index, color) => {
  currentBike.value.colors.splice(index, 1);
  if (currentBike.value.colors.length === 0) {
    currentBike.value.colors = null;
  }
  const colors_display = JSON.parse(currentBike.value.colors_display);
  delete colors_display[color];
  if (Object.keys(colors_display).length === 0) {
    colorModel.value = null;
  } else {
    colorModel.value = colors_display;
  }
};

const saveColors = () => {
  currentBike.value.colors_display = colorModel.value;
  showEditColorsDialog.value = false;
  console.log(currentBike.value.colors_display);
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
  selectedColumns.value = columns.value.slice(0, 7);
  getBikeBrands();
  refreshBikes();
});

watch(currentBike, () => {
  currentDialogImage.value = currentBike.value ? currentBike.value.image : "";
  currentBike.value.permis = permisValue.value;
  currentBike.value.omologare = omologareValue.value;
  showDialog.value = true;
});

watch(showDialog, () => {
  const body = document.getElementsByTagName("body")[0];
  if (!showDialog.value) {
    body.style.overflow = "auto";
  } else {
    body.style.overflow = "hidden";
  }
});
</script>
<style lang="scss">
/* Using original class names and refactoring the code to use SASS features */

.home-view {
  display: flex;
  gap: 2rem;
  position: relative;
  z-index: 5;
  background: var(--surface-0);
}

.table-actions {
  display: flex;
  gap: 1rem;
  .p-button {
    width: 3rem;
  }
}

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

main {
  flex: 6;
}

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

.left-info {
  width: 35vw;
}

.right-info {
  width: 65vw;
  display: flex;
  flex-flow: column;
  gap: 1rem;

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

  .gallery-row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
}

.color-help {
  .p-dialog-content {
    display: flex;
    flex-flow: column;
  }
}

.color-help-button {
  width: 30px;
  height: 30px;
}

.edit-colors-dialog {
  position: relative;
  h3 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .p-dialog-header {
    h3 {
      width: 300px;
    }
  }
  .p-button:not(.p-button:last-child) {
    position: absolute;
    width: 3rem;
    top: 2.3rem;
    right: 5rem;
  }
}

.edit-colors-dialog .p-dialog-content {
  height: fit-content;
}
.edit-colors-list {
  list-style: none;
  margin: 0;
  padding: 1rem;
  display: flex;
  flex-flow: row wrap;
  gap: 2rem;
  div {
    margin-bottom: 0.5rem;
    color: silver;
  }
}

.color-picker-wrapper {
  display: flex;
  height: 30px;
}
.color-picker-container {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.edit-color-input {
  width: 150px !important;
}
.p-colorpicker {
  padding: 0;
  margin: 0;
  .p-inputtext {
    width: 30px;
    height: 30px;
  }
}
.edit-color-name {
  display: flex;
  .p-button {
    width: 40px;
  }
}
.edit-color-label {
  display: inline-block;
  width: 130px;
  font-weight: bold;
  color: #fff;
  text-align: right;
  margin-right: 0.5rem;
}
.color-picker-button {
  width: 30px;
  padding: 0;
  height: 30px;
  margin: 0;
}
.form-row {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  .price-display {
    width: 100%;
  }
}

.form-column {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-right: 2rem;
}

.form-toggles {
  justify-content: space-between;
  .p-button {
    width: 20%;
  }
}

.p-float-label,
.p-inputtext,
.p-input-icon-left {
  width: 100%;
}

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

.pi-eye,
.pi-image {
  cursor: pointer;
}

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

.p-inputtextarea {
  resize: none;
  text-align: justify;
  text-justify: distribute;
  line-height: 34px;
  height: 35vh;
}

.img-container {
  width: 25vw;
  border-radius: 6px;

  & img {
    width: 50%;
    height: auto;
  }
}

.new-table-dialog {
  width: 50vw;
  height: 80vh;
  border-radius: 6px;
  text-align: center;
  display: flex;
  justify-content: center;
  .download-table {
    width: 100%;
  }
  .update-table {
    width: 49%;
  }
  .upload-table {
    width: 49%;
  }
  .p-dialog-content {
    display: flex;
    flex-flow: row wrap;
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