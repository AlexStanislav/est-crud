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
          <!-- <Button icon="pi pi-upload"
            severity="warning"
            title="Importa informatii tabele"
          ></Button> -->
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
          <Button
            icon="pi pi-pencil"
            severity="warning"
            @click="editTable(brand)"
          />
        </li>
      </ul>
    </nav>
    <main>
      <DataTable
        v-model:filters="filters"
        removableSort
        :value="currentBikes"
        size="small"
      >
        <Column sortable field="bike_name" header="Nume"> </Column>
        <Column sortable field="price" header="Pret">
          <template #body="slotProps">
            {{ slotProps.data.price ? slotProps.data.price : "Gol" }}
          </template>
        </Column>
        <Column sortable header="Pret vechi">
          <template #body="slotProps">
            {{ slotProps.data.old_price ? slotProps.data.old_price : "Gol" }}
          </template>
        </Column>
        <Column sortable field="capacitate" header="Capacitate"></Column>
        <Column sortable field="category" header="Categorie">
          <template #body="slotProps">
            {{ slotProps.data.category ? slotProps.data.category : "Gol" }}
          </template>
        </Column>
        <Column sortable field="main_year" header="An">
          <template #body="slotProps">
            {{ slotProps.data.main_year ? slotProps.data.main_year : "Gol" }}
          </template>
        </Column>
        <Column sortable header="Rabla">
          <template #body="slotProps">
            {{ slotProps.data.rabla ? slotProps.data.rabla : "Gol" }}
          </template>
        </Column>
        <Column sortable header="Permis">
          <template #body="slotProps">
            {{
              slotProps.data.permis.length > 0 ? slotProps.data.permis : "Gol"
            }}
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
              <!-- <Button icon="pi pi-trash" severity="danger" @click="confirmDelete($event, slotProps.data)" /> -->
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
            <InputText type="text" v-model="currentBike.brand" />
            <label>Marca</label>
          </FloatLabel>
        </div>
        <div class="form-row">
          <FloatLabel>
            <InputText type="text" v-model="currentBike.price" />
            <label>Pret</label>
          </FloatLabel>
          <FloatLabel>
            <InputText type="text" v-model="currentBike.old_price" />
            <label>Pret vechi</label>
          </FloatLabel>
        </div>
        <div class="form-row">
          <FloatLabel>
            <InputText type="text" v-model="currentBike.category" />
            <label>Categorie</label>
          </FloatLabel>
          <FloatLabel>
            <InputText type="text" v-model="currentBike.main_year" />
            <label>An</label>
          </FloatLabel>
        </div>
        <div class="form-row">
          <FloatLabel>
            <InputText type="text" v-model="currentBike.rabla" />
            <label>Rabla</label>
          </FloatLabel>
          <FloatLabel>
            <InputText type="text" v-model="currentBike.permis" />
            <label>Permis</label>
          </FloatLabel>
        </div>
        <div class="form-row">
          <FloatLabel>
            <InputText type="text" v-model="currentBike.capacitate" />
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
          <div class="form-column">
            <label>Exista in slideshow?</label>
            <ToggleButton
              v-model="currentBike.is_gallery"
              onLabel="Da"
              offLabel="Nu"
            />
          </div>
          <div class="form-column">
            <label>Exista in modele populare?</label>
            <ToggleButton
              v-model="currentBike.is_popular"
              onLabel="Da"
              offLabel="Nu"
            />
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
              <InputText type="text" :value="image" />
              <Image class="preview-image" preview>
                <template #indicatoricon>
                  <i class="pi pi-eye"></i>
                </template>
                <template #image>
                  <i class="pi pi-eye"></i>
                </template>
                <template #preview>
                  <img :src="image" alt="preview" />
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
        <FloatLabel>
          <InputText type="text" v-model="currentTable.brand" />
          <label>Marca {{ currentTable.name }}</label>
        </FloatLabel>
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
    <ConfirmPopup></ConfirmPopup>
    <Toast></Toast>
  </div>
</template>
<script setup>
import { onMounted, ref, watch } from "vue";
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

const toast = useToast();
const confirm = useConfirm();
const appStore = useAppStore();
const bikeBrands = ref([]);
const currentBikes = ref([]);
const currentBike = ref({});
const showDialog = ref(false);
const showNewTableDialog = ref(false);
const showTableEditDialog = ref(false);
const currentBrand = ref("");
const newGalleryImage = ref("");
const currentTableFilename = ref("");
const filters = ref({
  global: { value: null, matchMode: "contains" },
  bike_name: { value: null, matchMode: "contains" },
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
]);

const currentDialogImage = ref("");

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
    currentTable.value.brand = ""
    currentTable.vehicle_type = ""
    toast.add({
      severity: "success",
      summary: "Success",
      detail: `Modificari salvate`,
      life: 3000,
    });
  }
};

const editBike = (bike) => {
  showDialog.value = true;
  currentBike.value = { ...bike };
};

const showCurrentBikes = (brand) => {
  currentBrand.value = brand;
  currentBikes.value = appStore.allBikes[brand];
};

const refreshBikes = async () => {
  await appStore.getAllBikes();
  if (appStore.allBikes) {
    bikeBrands.value = Object.keys(appStore.allBikes);
    currentBrand.value = bikeBrands.value[0];
    currentBikes.value = appStore.allBikes[bikeBrands.value[0]];

    toast.add({
      severity: "success",
      summary: "Success",
      detail: `Tabele actualizate`,
      life: 3000,
    });
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
  refreshBikes();
});

watch(currentBike, () => {
  console.log(currentBike.value);
  currentDialogImage.value = currentBike.value ? currentBike.value.image : "";
  showDialog.value = true;
});
</script>
<style lang="scss">
/* Using original class names and refactoring the code to use SASS features */

/* Using original class names */
.home-view {
  display: flex;
  gap: 2rem;
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
      background: var(--primary-color);
      color: var(--primary-color-text);
      padding: 0.5rem;
      border-radius: 6px;

      &:hover {
        cursor: pointer;
        background: var(--blue-300);
      }
    }
  }
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
  .p-button{
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
  width: 30vw;
  height: 50vh;
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
}
</style>