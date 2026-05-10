# Data: CrisisBench (English)

This project uses **CrisisBench** (English) as the default benchmark dataset for crisis-related social media classification.

## Recommended dataset source

- Hugging Face Datasets: `QCRI/CrisisBench-english`

## Quick start

1. Create a Python environment (Python 3.10+ recommended).
2. Install ML dependencies:

```bash
pip install -r ../requirements-ml.txt
```

3. Run training (downloads dataset automatically):

```bash
python ../train.py --model_id distilbert-base-uncased --output_dir ../artifacts/distilbert-crisisbench
```

## Notes

- Some CrisisBench subsets may require accepting dataset terms or using a downloader. If automatic download fails, follow the dataset card instructions on Hugging Face.
- For portfolio purposes, keep a small “dev split” for rapid iteration and a full run for final metrics.

