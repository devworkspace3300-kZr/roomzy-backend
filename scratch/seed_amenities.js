async function seed() {
    try {
        const res = await fetch('http://localhost:3000/api/v1/amenities/seed', {
            method: 'POST'
        });
        const data = await res.json();
        console.log('Seed success:', data);
    } catch (error) {
        console.error('Seed failed:', error.message);
    }
}

seed();
