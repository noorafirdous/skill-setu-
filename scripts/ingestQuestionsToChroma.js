import 'dotenv/config';
import { ingestKnowledgeToChroma, getChromaStatus } from '../chromaService.js';

async function main() {
  console.log('====================================================');
  console.log('SkillSetu AI — ChromaDB Knowledge Base Ingestion');
  console.log('====================================================');

  const status = await getChromaStatus();
  console.log('Initial ChromaDB Status:', status);

  console.log('\nStarting question knowledge ingestion...');
  const result = await ingestKnowledgeToChroma();

  console.log('\nIngestion Result:', result);
  const updatedStatus = await getChromaStatus();
  console.log('Updated Status:', updatedStatus);

  if (result.success) {
    console.log(`\nSuccessfully populated collection "${updatedStatus.collection}" with ${updatedStatus.count} vector documents.`);
  } else {
    console.log('\nNote: ChromaDB server not running at configured URL. High-performance local vector engine fallback is actively serving all requests.');
  }
}

main().catch(console.error);
