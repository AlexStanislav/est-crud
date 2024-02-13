<template>
  <DataTable
    v-model:filters="requestFilters"
    :value="allRequests"
    :rowClass="getRowClass"
    size="small"
    :globalFilterFields="[
      'client_first_name',
      'client_last_name',
      'client_email',
      'client_address',
      'client_phone',
      'client_work_location',
      'vehicle_type',
    ]"
  >
    <template #header>
      <Button severity="success" icon="pi pi-refresh" @click="refreshRequests()" />
      <IconField iconPosition="left">
        <InputIcon>
          <i class="pi pi-search" />
        </InputIcon>
        <InputText
          v-model="requestFilters['global'].value"
          placeholder="Cautare"
        />
      </IconField>
    </template>
    <Column field="client_first_name" header="Nume Client" />
    <Column field="client_last_name" header="Prenume Client" />
    <Column field="client_email" header="Email" />
    <Column field="client_address" header="Adresa" />
    <Column field="client_phone" header="Telefon" />
    <Column field="client_work_location" header="Punct de lucru" />
    <Column field="vehicle_type" header="Tip vehicul" />
    <Column header="Actiuni">
      <template #body="slotProps">
        <div class="actions-container">
          <Button
            severity="success"
            icon="pi pi-eye"
            @click="showCurrentRequest(slotProps.data)"
          />
          <Button
            severity="danger"
            icon="pi pi-trash"
            @click="deleteRequest($event, slotProps.data)"
          />
        </div>
      </template>
    </Column>
  </DataTable>
  <Dialog class="request-dialog" v-model:visible="showRequestDialog" modal>
    <template #header>
      <h1>Detalii Cerere</h1>
    </template>
    <table class="request-table">
      <tr>
        <td class="table-label">Nume</td>
        <td class="table-value">{{ currentRequest.client_first_name }}</td>
        <td class="table-label">Email</td>
        <td class="table-value">{{ currentRequest.client_email }}</td>
      </tr>
      <tr>
        <td class="table-label">Prenume</td>
        <td class="table-value">{{ currentRequest.client_last_name }}</td>
        <td class="table-label">Telefon</td>
        <td class="table-value">{{ currentRequest.client_phone }}</td>
      </tr>
      <tr>
        <td class="table-label">Adresa</td>
        <td class="table-value">{{ currentRequest.client_address }}</td>
        <td class="table-label">Punct de lucru</td>
        <td class="table-value">{{ currentRequest.client_work_location }}</td>
      </tr>
      <tr>
        <td class="separator" colspan="4"></td>
      </tr>
      <tr>
        <td class="table-label">Tip vehicul</td>
        <td class="table-value">{{ currentRequest.vehicle_type }}</td>
        <td class="table-label">Marca</td>
        <td class="table-value">{{ currentRequest.brand }}</td>
      </tr>
      <tr>
        <td class="table-label">Model</td>
        <td class="table-value">{{ currentRequest.category }}</td>
        <td class="table-label">An Fabricatie</td>
        <td class="table-value">{{ currentRequest.main_year }}</td>
      </tr>
      <tr>
        <td class="table-label">Capacitate</td>
        <td class="table-value">{{ currentRequest.capacitate }}</td>
        <td class="table-label">Serie Cadru</td>
        <td class="table-value">{{ currentRequest.serial_number }}</td>
      </tr>
    </table>
    <div class="service-container">
      <div class="service-options">
        <h2>Servicii</h2>
        <div
          class="service-item"
          v-for="service in serviceOptions"
          :key="service"
        >
          <i class="pi pi-check"></i>
          <span>{{ service }}</span>
        </div>
      </div>
      <div class="service-details">
        <h2>Alte operatiuni</h2>
        <p>{{ currentRequest.other_operations }}</p>
      </div>
    </div>
    <template #footer>
      <Button
        label="Marcheaza activ"
        v-if="!currentRequest.is_active"
        severity="success"
        @click="markRequestAsActive()"
      />
      <Button
        label="Marcheaza inactiv"
        v-else
        severity="danger"
        @click="markRequestAsInactive()"
      />
    </template>
  </Dialog>
  <ConfirmPopup></ConfirmPopup>
</template>
<script setup>
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { onMounted, ref, watchEffect } from "vue";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import InputText from "primevue/inputtext";
import { useAppStore } from "../store/app.store";
import { FilterMatchMode } from "primevue/api";
import ConfirmPopup from "primevue/confirmpopup";
const appStore = useAppStore();

const allRequests = ref();
const currentRequest = ref();
const showRequestDialog = ref(false);
const serviceOptions = ref();
const confirm = useConfirm();
const toast = useToast();

const requestFilters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  client_first_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  client_last_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  client_email: { value: null, matchMode: FilterMatchMode.CONTAINS },
  client_address: { value: null, matchMode: FilterMatchMode.CONTAINS },
  client_phone: { value: null, matchMode: FilterMatchMode.CONTAINS },
  client_work_location: { value: null, matchMode: FilterMatchMode.CONTAINS },
  vehicle_type: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

onMounted(async () => {
  await appStore.getServiceInfo();
  allRequests.value = appStore.allRequests;
});

const refreshRequests = async () => {
  await appStore.getServiceInfo();
  allRequests.value = appStore.allRequests;
};

const showCurrentRequest = (data) => {
  currentRequest.value = data;
  showRequestDialog.value = true;
};

const markRequestAsActive = async () => {
  await appStore.markRequestAsActive(currentRequest.value.id);
  showRequestDialog.value = false;
  await appStore.getServiceInfo();
  allRequests.value = appStore.allRequests;
};

const markRequestAsInactive = async () => {
  await appStore.markRequestAsInactive(currentRequest.value.id);
  showRequestDialog.value = false;
  await appStore.getServiceInfo();
  allRequests.value = appStore.allRequests;
};

const deleteRequest = (event, data) => {
  confirm.require({
    target: event.currentTarget,
    message: "Esti sigur ca vrei sa stergi aceasta solicitare?",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Da",
    rejectLabel: "Nu",
    accept: async () => {
      await appStore.deleteRequest(data.id);
      allRequests.value = appStore.allRequests;
      await appStore.getServiceInfo();
      allRequests.value = appStore.allRequests;
    }
  })
};

const getServiceArray = (currentRequest) => {
  const serviceOptions = [];
  currentRequest.service_options
    .replace(/[{}""]/g, "")
    .split(",")
    .forEach((element) => {
      serviceOptions.push(element.trim());
    });
  return serviceOptions;
};

const getRowClass = (data) => {
  if (data.is_active === true) {
    return "active-request";
  }
};

watchEffect(() => {
  if (currentRequest.value) {
    serviceOptions.value = getServiceArray(currentRequest.value);
  }
});
</script>
<style lang="scss">
.separator {
  padding: 0.5rem;
}
.request-dialog {
  width: fit-content;
  height: fit-content;
  .p-dialog-content {
    display: flex;
    flex-flow: column;
    height: fit-content;
  }
}
.request-table {
  height: fit-content;
}
.p-datatable-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  .p-button {
    width: 3rem;
  }
}

.table-label {
  font-weight: bold;
  text-align: right;
  padding-right: 1rem;
}
.table-value {
  padding-right: 2rem;
}

.service-container {
  width: 100%;
  display: flex;
  gap: 1rem;
}

.service-options {
  width: 50%;
  display: flex;
  flex-flow: column;
}
.service-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  i {
    color: var(--green-600);
  }
}

.active-request {
  background: var(--green-700);
}

.service-details {
  width: 50%;
  display: flex;
  flex-flow: column;
  gap: 1rem;
}
</style>