// ============================================
// populate.js — Populate sections (Civik-ia site)
// Depends on: data.js (pricingTiers, whyReasons, testimonials)
//             animations.js (observeElements, scrollToSection)
// ============================================

function populatePricing() {
    const grid = document.getElementById('pricingGrid');
    // HTML statique déjà présent pour le SEO — on le vide pour recréer avec animations JS
    grid.innerHTML = '';

    // Setup fee banner
    const setupBanner = document.createElement('div');
    setupBanner.style.cssText = 'grid-column: 1 / -1; text-align: center; margin-bottom: 20px; padding: 32px; background: linear-gradient(135deg, rgba(0,0,145,0.04), rgba(0,123,255,0.06)); border-radius: 16px; border: 1px solid rgba(0,0,145,0.12);';
    setupBanner.innerHTML = `
        <div style="font-size: 0.75em; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: var(--accent-teal); margin-bottom: 10px;">\u{1F680} Programme Partenaires Fondateurs \u2014 10 places</div>
        <div style="font-size: 1.3em; font-weight: 800; color: var(--primary-gov); margin-bottom: 8px;">Mise en Service : <span style="text-decoration: line-through; opacity: 0.4; font-weight: 400;">999\u20ac HT</span> <span style="background: linear-gradient(135deg, var(--accent-teal), var(--secondary-innov)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 1.1em;">OFFERTE</span></div>
        <div style="font-size: 0.95em; color: var(--text-light); max-width: 700px; margin: 0 auto;">\u00c9tude de votre commune, cr\u00e9ation personnalis\u00e9e du bot, formation des agents, livraison et mise en service. <strong>Rejoignez les premi\u00e8res communes pionni\u00e8res.</strong></div>
        <div style="font-size: 0.8em; color: var(--text-light); margin-top: 8px; opacity: 0.6;">En \u00e9change : votre t\u00e9moignage comme commune pionni\u00e8re. Offre limit\u00e9e aux 10 premi\u00e8res communes.</div>
    `;
    grid.appendChild(setupBanner);

    pricingTiers.forEach((tier, index) => {
        const card = document.createElement('div');
        const isPremium = tier.premium;
        card.className = `pricing-card fade-in ${tier.featured ? 'featured' : ''}`;
        if (isPremium) card.style.cssText += 'border: 2px solid var(--accent-gold); background: linear-gradient(180deg, #fffaf5 0%, #fff 100%);';
        card.innerHTML = `
            ${tier.featured ? '<div class="featured-badge">\u2B50 Plus Populaire</div>' : ''}
            ${isPremium ? '<div class="featured-badge" style="background: linear-gradient(135deg, var(--accent-gold), var(--secondary-innov));">\u{1F3DB}\uFE0F Sur Devis</div>' : ''}
            <div class="pricing-target">${tier.target}</div>
            <div class="pricing-size">${tier.size}</div>
            <div class="pricing-amount">${isPremium ? tier.price : tier.price + '\u20ac'}</div>
            <div class="pricing-period">${isPremium ? '\u00c9tude pr\u00e9alable incluse' : '/mois HT \u2014 engagement 12 mois'}</div>
            <ul class="pricing-features">
                ${tier.features.map(f => `<li>${f}</li>`).join('')}
            </ul>
            <button class="btn-pricing" onclick="scrollToSection('contact')">${isPremium ? 'Nous contacter' : 'D\u00e9marrer'}</button>
        `;
        grid.appendChild(card);
    });
    observeElements('.pricing-card');

    // Campaign packs banner
    const packsBanner = document.createElement('div');
    packsBanner.className = 'fade-in';
    packsBanner.style.cssText = 'grid-column: 1 / -1; text-align: center; margin-top: 24px; padding: 24px 32px; background: rgba(46,196,182,0.06); border-radius: 16px; border: 1px solid rgba(46,196,182,0.2);';
    packsBanner.innerHTML = `
        <div style="font-size: 1.1em; font-weight: 700; color: var(--accent-teal); margin-bottom: 8px;">\u{1F4CA} Besoin de campagnes suppl\u00e9mentaires ?</div>
        <div style="font-size: 0.9em; color: var(--text-light); display: flex; justify-content: center; gap: 40px; flex-wrap: wrap;">
            <span><strong style="color: var(--primary-gov);">Pack +2 campagnes</strong> \u2014 49\u20ac HT</span>
            <span><strong style="color: var(--primary-gov);">Pack +5 campagnes</strong> \u2014 99\u20ac HT</span>
        </div>
        <div style="font-size: 0.8em; color: var(--text-light); margin-top: 8px; opacity: 0.7;">Utilisables sur l\u2019ann\u00e9e civile en cours. Cumulables avec votre forfait.</div>
    `;
    grid.appendChild(packsBanner);
}

function populateWhy() {
    const grid = document.getElementById('whyGrid');
    grid.innerHTML = '';
    whyReasons.forEach((reason) => {
        const card = document.createElement('div');
        card.className = 'why-card fade-in';
        card.innerHTML = `
            <span class="why-icon">${reason.icon}</span>
            <div class="why-title">${reason.title}</div>
            <div class="why-text">${reason.text}</div>
        `;
        grid.appendChild(card);
    });
    observeElements('.why-card');
}

function populateTestimonials() {
    const grid = document.getElementById('testimonialsGrid');
    grid.innerHTML = '';
    testimonials.forEach((testimonial) => {
        const card = document.createElement('div');
        card.className = 'testimonial-card fade-in';
        card.innerHTML = `
            <div class="stars">\u2605\u2605\u2605\u2605\u2605</div>
            <div class="testimonial-text">"${testimonial.quote}"</div>
            <div class="testimonial-author">
                <div class="author-avatar ${testimonial.class}">${testimonial.initials}</div>
                <div class="author-info">
                    <h4>${testimonial.name}</h4>
                    <p>${testimonial.title}</p>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
    observeElements('.testimonial-card');
}
