const axios = require('axios');

async function testFetch() {
  try {
    const id = '4c87c935-487b-4778-92b9-a3ea4b955e0e';
    const res = await axios.get(`http://localhost:3000/api/v1/hostels/${id}`);
    console.log('Hostel Response:', JSON.stringify(res.data, null, 2));
    
    const roomsRes = await axios.get(`http://localhost:3000/api/v1/rooms?hostelId=${id}`);
    console.log('Rooms Response:', JSON.stringify(roomsRes.data, null, 2));
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}

testFetch();
