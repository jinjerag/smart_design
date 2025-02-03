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

  addComponentConfirm.addEventListener('click', () => {
    const component = componentSelect.value;
    const subtype = subtypeSelect.value || 'N/A';
    const pricePerUnit = parseFloat(document.getElementById('pricePerUnit').value);
    const quantity = parseFloat(document.getElementById('quantity').value);

    if (!component || isNaN(pricePerUnit) || isNaN(quantity)) {
      alert('Please fill in all fields correctly');
      return;
    }

    const total = pricePerUnit * quantity;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${component}</td>
      <td>${subtype}</td>
      <td>${pricePerUnit.toFixed(2)}</td>
      <td>${quantity}</td>
      <td>${total.toFixed(2)}</td>
      <td>
        <button class="btn btn-sm btn-danger remove-row">🗑️</button>
      </td>
    `;

    row.querySelector('.remove-row').addEventListener('click', () => {
      row.remove();
      updateTotals();
    });

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
      createdAt: new Date().toISOString()
    };

    let savedProjects = JSON.parse(localStorage.getItem('smartDesignProjects') || '[]');
    
    const existingProjectIndex = savedProjects.findIndex(p => p.id === project.id);
    
    if (existingProjectIndex !== -1) {
      savedProjects[existingProjectIndex] = project;
    } else {
      savedProjects.push(project);
    }

    localStorage.setItem('smartDesignProjects', JSON.stringify(savedProjects));
    
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
    loadSavedProjects();
  }

  function loadSavedProjects() {
    const projectsGrid = document.getElementById('projectsGrid');
    const noProjectsMessage = document.getElementById('noProjectsMessage');
    const savedProjects = JSON.parse(localStorage.getItem('smartDesignProjects') || '[]');

    projectsGrid.innerHTML = '';

    if (savedProjects.length === 0) {
      noProjectsMessage.style.display = 'block';
      return;
    }

    noProjectsMessage.style.display = 'none';

    savedProjects.forEach(project => {
      const projectCard = document.createElement('div');
      projectCard.className = 'col-md-4 mb-4';
      projectCard.innerHTML = `
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">${project.name}</h5>
            <p class="card-text">
              <strong>Project ID:</strong> ${project.id}<br>
              <strong>Created:</strong> ${new Date(project.createdAt).toLocaleDateString()}<br>
              <strong>Grand Total:</strong> ${project.finalGrandTotal}
            </p>
            <div class="d-flex justify-content-between">
              <button class="btn btn-sm btn-primary load-project" data-id="${project.id}">
                <i class="feather feather-edit"></i> Edit
              </button>
              <button class="btn btn-sm btn-danger delete-project" data-id="${project.id}">
                <i class="feather feather-trash-2"></i> Delete
              </button>
              <button class="btn btn-sm btn-success export-project" data-id="${project.id}">
                <i class="feather feather-download"></i> Export PDF
              </button>
            </div>
          </div>
        </div>
      `;

      projectsGrid.appendChild(projectCard);
    });

    projectsGrid.querySelectorAll('.load-project').forEach(btn => {
      btn.addEventListener('click', (e) => loadProjectForEditing(e.target.closest('.load-project').dataset.id));
    });

    projectsGrid.querySelectorAll('.delete-project').forEach(btn => {
      btn.addEventListener('click', (e) => deleteProject(e.target.closest('.delete-project').dataset.id));
    });

    projectsGrid.querySelectorAll('.export-project').forEach(btn => {
      btn.addEventListener('click', (e) => exportProjectToPDF(e.target.closest('.export-project').dataset.id));
    });
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
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${comp.component}</td>
        <td>${comp.subtype}</td>
        <td>${comp.pricePerUnit}</td>
        <td>${comp.quantity}</td>
        <td>${comp.total}</td>
        <td>
          <button class="btn btn-sm btn-danger remove-row">🗑️</button>
        </td>
      `;

      row.querySelector('.remove-row').addEventListener('click', () => {
        row.remove();
        updateTotals();
      });

      componentsBody.appendChild(row);
    });

    document.getElementById('installationCost').value = project.installationCost;
    document.getElementById('transportationCost').value = project.transportationCost;
    document.getElementById('craneCost').value = project.craneCost;
    document.getElementById('otherExpenses').value = project.otherExpenses;

    updateTotals();
  }

  function deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project?')) return;

    let savedProjects = JSON.parse(localStorage.getItem('smartDesignProjects') || '[]');
    savedProjects = savedProjects.filter(p => p.id !== projectId);

    localStorage.setItem('smartDesignProjects', JSON.stringify(savedProjects));
    
    loadSavedProjects();
  }

  function exportProjectToPDF(projectId) {
    const savedProjects = JSON.parse(localStorage.getItem('smartDesignProjects') || '[]');
    const project = savedProjects.find(p => p.id === projectId);

    if (!project) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Smart Design - Project Details', 10, 10);
    doc.setFontSize(10);

    doc.text(`Project Name: ${project.name}`, 10, 20);
    doc.text(`Project ID: ${project.id}`, 10, 30);
    doc.text(`Created: ${new Date(project.createdAt).toLocaleDateString()}`, 10, 40);

    const components = project.components.map(comp => [
      comp.component,
      comp.subtype,
      comp.pricePerUnit,
      comp.quantity,
      comp.total
    ]);

    doc.autoTable({
      startY: 50,
      head: [['Component', 'Subtype', 'Price/Unit', 'Quantity', 'Total']],
      body: components
    });

    const finalY = doc.autoTable.previous.finalY + 10;
    doc.text(`Grand Total: ${project.grandTotal}`, 10, finalY);
    doc.text(`Final Price: ${project.finalPrice}`, 10, finalY + 10);
    
    doc.text(`Installation Cost: ${project.installationCost}`, 10, finalY + 20);
    doc.text(`Transportation Cost: ${project.transportationCost}`, 10, finalY + 30);
    doc.text(`Crane Cost: ${project.craneCost}`, 10, finalY + 40);
    doc.text(`Other Expenses: ${project.otherExpenses}`, 10, finalY + 50);
    
    doc.text(`Final Grand Total: ${project.finalGrandTotal}`, 10, finalY + 60);

    doc.text('Notes:', 10, finalY + 80);
    doc.text(project.notes, 10, finalY + 90);

    doc.save(`smart-design-project-${project.id}.pdf`);
  }

  saveProjectBtn.addEventListener('click', saveProject);

  loadSavedProjects();

  exportPdfBtn.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Smart Design - Project Details', 10, 10);
    doc.setFontSize(10);

    doc.text(`Project Name: ${document.getElementById('projectName').value}`, 10, 20);
    doc.text(`Project ID: ${document.getElementById('projectId').value}`, 10, 30);

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
    doc.text(`Grand Total: ${grandTotalSpan.textContent}`, 10, finalY);
    doc.text(`Final Price: ${finalPriceSpan.textContent}`, 10, finalY + 10);
    doc.text(`Final Grand Total: ${finalGrandTotalSpan.textContent}`, 10, finalY + 20);

    doc.text('Notes:', 10, finalY + 40);
    doc.text(document.getElementById('projectNotes').value, 10, finalY + 50);

    doc.save('smart-design-project.pdf');
  });
});