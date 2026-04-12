// ============================================
// forms.js — Form handling (Civik-ia site)
// ============================================

// Google Sheets endpoint pour centraliser les leads
const GSHEET_URL = 'https://script.google.com/macros/s/AKfycbx9fgSpvQiDS6wrkR35l1ZkUIclB7KLrzsIM-BTycCM8h3sGK51JagtBe4zo6-ogkg3/exec';

function sendToGoogleSheet(data) {
    fetch(GSHEET_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).catch(() => {}); // Silent fail — Formspree reste la source principale
}

function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('.btn-submit');
    submitBtn.textContent = 'Envoi en cours...';
    submitBtn.disabled = true;

    // Envoi parallèle au Google Sheet
    sendToGoogleSheet({
        name: formData.get('name'),
        email: formData.get('email'),
        city: formData.get('city'),
        population: formData.get('population'),
        message: formData.get('message'),
        source: 'contact'
    });

    fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
    }).then(response => {
        if (response.ok) {
            form.style.display = 'none';
            document.getElementById('formSuccess').style.display = 'block';
        } else {
            submitBtn.textContent = 'Envoyer';
            submitBtn.disabled = false;
            alert('Une erreur est survenue. Envoyez-nous un email à contact@civik-ia.fr');
        }
    }).catch(() => {
        submitBtn.textContent = 'Envoyer';
        submitBtn.disabled = false;
        alert('Erreur de connexion. Envoyez-nous un email à contact@civik-ia.fr');
    });
}

function handleParrainageSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Envoi en cours...';
    submitBtn.disabled = true;

    // Envoi parallèle au Google Sheet
    sendToGoogleSheet({
        name: formData.get('parrain_commune') + ' → ' + formData.get('filleul_commune'),
        email: formData.get('parrain_email'),
        city: formData.get('filleul_commune'),
        population: '',
        message: 'PARRAINAGE — Recommandant: ' + formData.get('parrain_nom') + ' / Contact commune recommandée: ' + formData.get('filleul_contact'),
        source: 'parrainage'
    });

    fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
    }).then(response => {
        if (response.ok) {
            form.style.display = 'none';
            document.getElementById('parrainageSuccess').style.display = 'block';
        } else {
            submitBtn.textContent = 'Envoyer ma recommandation';
            submitBtn.disabled = false;
            alert('Une erreur est survenue. Envoyez-nous un email à contact@civik-ia.fr');
        }
    }).catch(() => {
        submitBtn.textContent = 'Envoyer ma recommandation';
        submitBtn.disabled = false;
        alert('Erreur de connexion. Envoyez-nous un email à contact@civik-ia.fr');
    });
}
