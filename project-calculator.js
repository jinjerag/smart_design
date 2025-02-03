document.addEventListener('DOMContentLoaded', () => {
  const componentSelect = document.getElementById('componentSelect');
  const subtypeSelect = document.getElementById('subtypeSelect');
  const addComponentBtn = document.getElementById('addComponentBtn');
  const componentModal = new bootstrap.Modal(document.getElementById('componentModal'));
  const addComponentConfirm = document.getElementById('addComponentConfirm');
  const componentsBody = document.getElementById('componentsBody');
  const grandTotalSpan = document.getElementById('grandTotal');
  const finalPriceSpan = document.getElementById('finalPrice');
  const finalGrandTotalSpan = document.getElementById('finalGrandTotal');
  const saveProjectBtn = document.getElementById('saveProjectBtn');
  const exportPdfBtn = document.getElementById('exportPdfBtn');

  const componentSubtypes = {
    metal: ['25x25', '30x50', '40x50', '60x30'],
    forex: ['5mm', '8mm', '10mm', '15mm', '20mm'],
    led: ['1.2w', '1.5w', 'China'],
    chon: ['Aluminium', 'Galva', 'Plastic', 'Perforé'],
    transfo: ['100w', '150w', '200w', '250w', '300w', '350w', '400w', '450w', '500w'],
    alucobond: [],
    pmma: [],
    ligneElectrique: [],
    boulon: [],
    akFix: [],
    vis: [],
    imp: [],
    pliageAlucobond: []
  };

  // Check if editing an existing project or creating a new sub-project
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');
  const largeProjectId = urlParams.get('largeProjectId');
  const subProjectName = urlParams.get('subProjectName');
  const subProjectId = urlParams.get('subProjectId');

  // If this is a sub-project, pre-fill some details
  if (largeProjectId) {
    // Retrieve the large project details
    const savedLargeProjects = JSON.parse(localStorage.getItem('smartDesignLargeProjects') || '[]');
    const largeProject = savedLargeProjects.find(p => p.id === largeProjectId);

    if (largeProject) {
      // Pre-fill sub-project name and ID if not provided
      document.getElementById('projectName').value = subProjectName || `Sub-Project for ${largeProject.name}`;
      document.getElementById('projectId').value = subProjectId || Date.now().toString();
      
      // Add a hidden input to track the large project ID
      const largeProjectInput = document.createElement('input');
      largeProjectInput.type = 'hidden';
      largeProjectInput.id = 'largeProjectIdInput';
      largeProjectInput.value = largeProjectId;
      document.querySelector('.card-body').appendChild(largeProjectInput);
    }
  }

  componentSelect.addEventListener('change', () => {
    const selectedComponent = componentSelect.value;
    const subtypes = componentSubtypes[selectedComponent];

    subtypeSelect.innerHTML = '<option value="">Select Subtype</option>';
    if (subtypes.length > 0) {
      subtypes.forEach(subtype => {
        const option = document.createElement('option');
        option.value = subtype;
        option.textContent = subtype;
        subtypeSelect.appendChild(option);
      });
      subtypeSelect.style.display = 'block';
    } else {
      subtypeSelect.style.display = 'none';
    }
  });

  addComponentBtn.addEventListener('click', () => {
    componentModal.show();
  });

  const editComponentModal = new bootstrap.Modal(document.getElementById('editComponentModal'));
  const editComponentSelect = document.getElementById('editComponentSelect');
  const editSubtypeSelect = document.getElementById('editSubtypeSelect');
  const editPricePerUnitInput = document.getElementById('editPricePerUnit');
  const editQuantityInput = document.getElementById('editQuantity');
  const saveEditComponentBtn = document.getElementById('saveEditComponentBtn');

  let currentEditRow = null;

  componentsBody.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-component');
    if (editBtn) {
      currentEditRow = editBtn.closest('tr');
      
      // Populate edit modal with current row's data
      const component = currentEditRow.querySelector('td:nth-child(1)').textContent;
      const subtype = currentEditRow.querySelector('td:nth-child(2)').textContent;
      const pricePerUnit = currentEditRow.querySelector('td:nth-child(3)').textContent;
      const quantity = currentEditRow.querySelector('td:nth-child(4)').textContent;

      // Set component select
      editComponentSelect.value = component;
      triggerSubtypeUpdate(editComponentSelect, editSubtypeSelect, component, subtype);

      editPricePerUnitInput.value = pricePerUnit;
      editQuantityInput.value = quantity;

      editComponentModal.show();
    }
  });

  function triggerSubtypeUpdate(componentSelect, subtypeSelect, selectedComponent, selectedSubtype = '') {
    const subtypes = componentSubtypes[selectedComponent] || [];

    subtypeSelect.innerHTML = '<option value="">Select Subtype</option>';
    if (subtypes.length > 0) {
      subtypes.forEach(subtype => {
        const option = document.createElement('option');
        option.value = subtype;
        option.textContent = subtype;
        if (subtype === selectedSubtype) {
          option.selected = true;
        }
        subtypeSelect.appendChild(option);
      });
      subtypeSelect.style.display = 'block';
    } else {
      subtypeSelect.style.display = 'none';
    }
  }

  editComponentSelect.addEventListener('change', () => {
    const selectedComponent = editComponentSelect.value;
    triggerSubtypeUpdate(editComponentSelect, editSubtypeSelect, selectedComponent);
  });

  saveEditComponentBtn.addEventListener('click', () => {
    const component = editComponentSelect.value;
    const subtype = editSubtypeSelect.value || 'N/A';
    const pricePerUnit = parseFloat(editPricePerUnitInput.value);
    const quantity = parseFloat(editQuantityInput.value);

    if (!component || isNaN(pricePerUnit) || isNaN(quantity)) {
      alert('Please fill in all fields correctly');
      return;
    }

    const total = pricePerUnit * quantity;

    // Update the row
    currentEditRow.querySelector('td:nth-child(1)').textContent = component;
    currentEditRow.querySelector('td:nth-child(2)').textContent = subtype;
    currentEditRow.querySelector('td:nth-child(3)').textContent = pricePerUnit.toFixed(2);
    currentEditRow.querySelector('td:nth-child(4)').textContent = quantity;
    currentEditRow.querySelector('td:nth-child(5)').textContent = total.toFixed(2);

    updateTotals();
    editComponentModal.hide();
  });

  function createComponentRow(component, subtype, pricePerUnit, quantity) {
    const total = pricePerUnit * quantity;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td data-label="Component">${component}</td>
      <td data-label="Subtype">${subtype}</td>
      <td data-label="Price/Unit">${pricePerUnit.toFixed(2)}</td>
      <td data-label="Quantity">${quantity}</td>
      <td data-label="Total">${total.toFixed(2)}</td>
      <td data-label="Actions">
        <button class="btn btn-sm btn-primary edit-component me-1">
          <i class="feather feather-edit"></i>
        </button>
        <button class="btn btn-sm btn-danger remove-row">
          <i class="feather feather-trash-2"></i>
        </button>
      </td>
    `;

    row.querySelector('.remove-row').addEventListener('click', () => {
      row.remove();
      updateTotals();
    });

    return row;
  }

  addComponentConfirm.addEventListener('click', () => {
    const component = componentSelect.value;
    const subtype = subtypeSelect.value || 'N/A';
    const pricePerUnit = parseFloat(document.getElementById('pricePerUnit').value);
    const quantity = parseFloat(document.getElementById('quantity').value);

    if (!component || isNaN(pricePerUnit) || isNaN(quantity)) {
      alert('Please fill in all fields correctly');
      return;
    }

    const row = createComponentRow(component, subtype, pricePerUnit, quantity);
    componentsBody.appendChild(row);
    updateTotals();
    componentModal.hide();
  });

  function updateTotals() {
    const rows = componentsBody.querySelectorAll('tr');
    let grandTotal = 0;

    rows.forEach(row => {
      const total = parseFloat(row.querySelector('td:nth-child(5)').textContent);
      grandTotal += total;
    });

    const additionalCosts = Array.from(document.querySelectorAll('.cost-input')).reduce((sum, input) => sum + parseFloat(input.value || 0), 0);

    const finalPrice = grandTotal * 2;
    const finalGrandTotal = finalPrice + additionalCosts;

    grandTotalSpan.textContent = grandTotal.toFixed(2);
    finalPriceSpan.textContent = finalPrice.toFixed(2);
    finalGrandTotalSpan.textContent = finalGrandTotal.toFixed(2);
  }

  document.querySelectorAll('.cost-input').forEach(input => {
    input.addEventListener('input', updateTotals);
  });

  function saveProject() {
    const projectName = document.getElementById('projectName').value;
    const projectId = document.getElementById('projectId').value;
    
    if (!projectName || !projectId) {
      alert('Please enter Project Name and Project ID');
      return;
    }

    const components = Array.from(componentsBody.querySelectorAll('tr')).map(row => ({
      component: row.querySelector('td:nth-child(1)').textContent,
      subtype: row.querySelector('td:nth-child(2)').textContent,
      pricePerUnit: row.querySelector('td:nth-child(3)').textContent,
      quantity: row.querySelector('td:nth-child(4)').textContent,
      total: row.querySelector('td:nth-child(5)').textContent
    }));

    const project = {
      id: projectId,
      name: projectName,
      components: components,
      grandTotal: grandTotalSpan.textContent,
      finalPrice: finalPriceSpan.textContent,
      installationCost: document.getElementById('installationCost').value,
      transportationCost: document.getElementById('transportationCost').value,
      craneCost: document.getElementById('craneCost').value,
      otherExpenses: document.getElementById('otherExpenses').value,
      finalGrandTotal: finalGrandTotalSpan.textContent,
      notes: document.getElementById('projectNotes').value,
      createdAt: new Date().toISOString(),
      largeProjectId: document.getElementById('largeProjectIdInput') 
        ? document.getElementById('largeProjectIdInput').value 
        : null
    };

    let savedProjects = JSON.parse(localStorage.getItem('smartDesignProjects') || '[]');
    
    const existingProjectIndex = savedProjects.findIndex(p => p.id === project.id);
    
    if (existingProjectIndex !== -1) {
      savedProjects[existingProjectIndex] = project;
    } else {
      savedProjects.push(project);
    }

    localStorage.setItem('smartDesignProjects', JSON.stringify(savedProjects));
    
    // Reset form
    document.getElementById('projectName').value = '';
    document.getElementById('projectId').value = '';
    document.getElementById('projectNotes').value = '';
    
    componentsBody.innerHTML = ''; // Clear components table
    
    document.getElementById('installationCost').value = '0';
    document.getElementById('transportationCost').value = '0';
    document.getElementById('craneCost').value = '0';
    document.getElementById('otherExpenses').value = '0';
    
    grandTotalSpan.textContent = '0.00';
    finalPriceSpan.textContent = '0.00';
    finalGrandTotalSpan.textContent = '0.00';
    
    alert('Project saved successfully!');
    
    // Redirect based on context
    if (largeProjectId) {
      // If this is a sub-project, return to the large project view
      window.location.href = `large-project.html?id=${largeProjectId}`;
    } else {
      // Otherwise, go to the main projects page
      window.location.href = 'index.html';
    }
  }

  function loadProjectForEditing(projectId) {
    const savedProjects = JSON.parse(localStorage.getItem('smartDesignProjects') || '[]');
    const project = savedProjects.find(p => p.id === projectId);

    if (!project) return;

    document.getElementById('projectName').value = project.name;
    document.getElementById('projectId').value = project.id;
    document.getElementById('projectNotes').value = project.notes;

    componentsBody.innerHTML = '';

    project.components.forEach(comp => {
      const row = createComponentRow(comp.component, comp.subtype, parseFloat(comp.pricePerUnit), parseFloat(comp.quantity));

      componentsBody.appendChild(row);
    });

    document.getElementById('installationCost').value = project.installationCost || '0';
    document.getElementById('transportationCost').value = project.transportationCost || '0';
    document.getElementById('craneCost').value = project.craneCost || '0';
    document.getElementById('otherExpenses').value = project.otherExpenses || '0';

    // If this project belongs to a large project, add the hidden input
    if (project.largeProjectId) {
      const largeProjectInput = document.createElement('input');
      largeProjectInput.type = 'hidden';
      largeProjectInput.id = 'largeProjectIdInput';
      largeProjectInput.value = project.largeProjectId;
      document.querySelector('.card-body').appendChild(largeProjectInput);
    }

    updateTotals();
  }

  function exportProjectToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Project Calculator - Project Details', 10, 10);
    doc.setFontSize(10);

    const projectName = document.getElementById('projectName').value;
    const projectId = document.getElementById('projectId').value;

    doc.text(`Project Name: ${projectName}`, 10, 20);
    doc.text(`Project ID: ${projectId}`, 10, 30);

    // Collect components data
    const components = Array.from(componentsBody.querySelectorAll('tr')).map(row => [
      row.querySelector('td:nth-child(1)').textContent,
      row.querySelector('td:nth-child(2)').textContent,
      row.querySelector('td:nth-child(3)').textContent,
      row.querySelector('td:nth-child(4)').textContent,
      row.querySelector('td:nth-child(5)').textContent
    ]);

    doc.autoTable({
      startY: 40,
      head: [['Component', 'Subtype', 'Price/Unit', 'Quantity', 'Total']],
      body: components
    });

    const finalY = doc.autoTable.previous.finalY + 10;
  
    // Financial details
    doc.text(`Grand Total: ${grandTotalSpan.textContent}`, 10, finalY);
    doc.text(`Final Price: ${finalPriceSpan.textContent}`, 10, finalY + 10);
  
    // Additional costs
    doc.text(`Installation Cost: ${document.getElementById('installationCost').value}`, 10, finalY + 20);
    doc.text(`Transportation Cost: ${document.getElementById('transportationCost').value}`, 10, finalY + 30);
    doc.text(`Crane Cost: ${document.getElementById('craneCost').value}`, 10, finalY + 40);
    doc.text(`Other Expenses: ${document.getElementById('otherExpenses').value}`, 10, finalY + 50);
  
    doc.text(`Final Grand Total: ${finalGrandTotalSpan.textContent}`, 10, finalY + 60);

    // Notes
    doc.text('Notes:', 10, finalY + 80);
    doc.text(document.getElementById('projectNotes').value, 10, finalY + 90);

    doc.save(`project-calculator-${projectId}.pdf`);
  }

  // Update the export PDF button event listener
  exportPdfBtn.addEventListener('click', exportProjectToPDF);

  saveProjectBtn.addEventListener('click', saveProject);

  // If a project ID is provided in the URL, load the project for editing
  if (projectId) {
    loadProjectForEditing(projectId);
  }
});