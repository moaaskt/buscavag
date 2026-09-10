import { CandidateRepository } from './db/candidateRepository';
import { hashPassword } from './lib/auth';

async function createAdmin() {
  const repo = new CandidateRepository();
  const email = 'moa@admin';
  const password = 'santos@123';
  
  // Revertendo moacirneto59@gmail.com para CANDIDATE
  try {
    const db = (repo as any).db;
    db.prepare('UPDATE users SET role = ? WHERE email = ?').run('CANDIDATE', 'moacirneto59@gmail.com');
    console.log('✅ Usuário moacirneto59@gmail.com revertido para CANDIDATE.');
  } catch (err) {
    console.log('Aviso ao reverter moacirneto59:', err);
  }

  // Verifica se o admin já existe
  const existing = repo.getUserByEmail(email);
  if (existing) {
    console.log('✅ Usuário admin já existe. Atualizando senha...');
    const hashed = await hashPassword(password);
    const db = (repo as any).db;
    db.prepare('UPDATE users SET password_hash = ?, role = ? WHERE email = ?').run(hashed, 'ADMIN', email);
    console.log('✅ Senha e Role atualizadas.');
    return;
  }

  // Cria o novo admin
  const hashed = await hashPassword(password);
  const id = `usr_admin_${Date.now()}`;
  repo.createUser({
    id,
    email,
    password_hash: hashed,
    name: 'Moacir Admin',
    role: 'ADMIN'
  });
  console.log(`✅ Admin ${email} criado com sucesso!`);
}

createAdmin().catch(console.error);
