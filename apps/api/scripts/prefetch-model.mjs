// Run at Docker build time so the sentiment model ships inside the image
// instead of being downloaded on every cold container start (see
// SentimentService — this loads the exact same model/task it does).
import { pipeline } from '@xenova/transformers'

const MODEL_NAME = 'Xenova/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7'

console.log(`Prefetching ${MODEL_NAME}...`)
await pipeline('zero-shot-classification', MODEL_NAME)
console.log('Model cached into the image.')
