const bcrypt = require('bcrypt');
const arg = process.argv[2] || 'password123';
(async ()=>{
  const h = await bcrypt.hash(arg, 10);
  console.log('hash:', h);
})();