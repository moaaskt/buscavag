import { db } from './db/index';

// Argumentos da linha de comando
const emailToPromote = process.argv[2];

if (!emailToPromote) {
  console.log('Listando todos os usuários atuais:');
  const users = db.prepare('SELECT id, email, name, role FROM users').all();
  console.table(users);
  console.log('\nPara promover alguém a ADMIN, rode: npx tsx src/make-admin.ts <email>');
  process.exit(0);
}

const user = db.prepare('SELECT * FROM users WHERE email = ?').get(emailToPromote);
if (!user) {
  console.log(`Erro: Usuário com email ${emailToPromote} não encontrado.`);
  process.exit(1);
}

try {
  db.prepare('UPDATE users SET role = ? WHERE email = ?').run('ADMIN', emailToPromote);
  console.log(`✅ Sucesso! O usuário ${emailToPromote} agora é um ADMIN.`);
} catch (err) {
  console.error('Erro ao atualizar usuário:', err);
}
