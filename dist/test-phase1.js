import { JobRepository } from './db/repository.js';
import { PlatformSource } from './types/job.js';
import { parseRelativeDate, isOlderThanDays } from './utils/date.js';
console.log('--- Executando teste do módulo base Buscavag ---');
const repo = new JobRepository();
const sampleJob = {
    title: 'Desenvolvedor Full Stack Jr',
    company: 'Tech Solutions',
    platform: PlatformSource.LINKEDIN,
    url: 'https://linkedin.com/jobs/view/123456',
    description: 'Vaga para Dev Full Stack Junior com React e Node.js',
    publishedAt: parseRelativeDate('há 2 dias'),
    location: 'Remoto',
};
console.log('Verificando se a vaga existe no banco...');
console.log('Existe?', repo.exists(sampleJob.url, sampleJob.company, sampleJob.title));
console.log('Inserindo vaga de teste no banco...');
const inserted = repo.insert(sampleJob, true, 95, 'Vaga atende 100% o perfil Junior Fullstack');
console.log('Vaga inserida:', inserted.id, inserted.title);
console.log('Verificando filtro de data (5 dias)...');
console.log('A vaga é mais antiga que 5 dias?', isOlderThanDays(sampleJob.publishedAt, 5));
console.log('Verificando vagas pendentes de notificação...');
const pending = repo.getPendingNotifications();
console.log('Total pendente:', pending.length);
console.log('Marcando vaga como notificada...');
repo.markAsNotified(inserted.id);
console.log('Total pendente após notificação:', repo.getPendingNotifications().length);
console.log('--- Teste concluído com sucesso ---');
