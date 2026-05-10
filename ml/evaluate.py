from __future__ import annotations

import argparse
import json
import os

import numpy as np
from datasets import load_dataset
from sklearn.metrics import classification_report, confusion_matrix
from transformers import AutoModelForSequenceClassification, AutoTokenizer


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--dataset_id", default="QCRI/CrisisBench-english")
    p.add_argument("--model_dir", required=True)
    p.add_argument("--split", default="test")
    p.add_argument("--max_length", type=int, default=256)
    p.add_argument("--limit", type=int, default=5000)
    p.add_argument("--output_dir", default=None)
    return p.parse_args()


def main() -> None:
    args = parse_args()
    out_dir = args.output_dir or args.model_dir
    os.makedirs(out_dir, exist_ok=True)

    ds = load_dataset(args.dataset_id)
    if args.split not in ds:
        # fall back if only train exists
        split_ds = ds["train"].train_test_split(test_size=0.1, seed=42)["test"]
    else:
        split_ds = ds[args.split]

    # Column detection (same heuristics as train)
    text_col = next((c for c in ["tweet_text", "text", "content"] if c in split_ds.column_names), None)
    label_col = next((c for c in ["label", "labels", "category", "class"] if c in split_ds.column_names), None)
    if text_col is None or label_col is None:
        raise RuntimeError(f"Could not find text/label columns in: {split_ds.column_names}")

    if args.limit:
        split_ds = split_ds.select(range(min(args.limit, len(split_ds))))

    tok = AutoTokenizer.from_pretrained(args.model_dir, use_fast=True)
    model = AutoModelForSequenceClassification.from_pretrained(args.model_dir)
    model.eval()

    texts = split_ds[text_col]
    labels = np.array(split_ds[label_col])

    # Map string labels to IDs if needed
    if labels.dtype.type is np.str_ or isinstance(labels[0], str):
        label2id = getattr(model.config, "label2id", None) or {}
        labels = np.array([label2id.get(str(x), 0) for x in labels], dtype=np.int64)

    # Batched inference on CPU
    batch = 32
    preds: list[int] = []
    import torch

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    for i in range(0, len(texts), batch):
        enc = tok(
            texts[i : i + batch],
            truncation=True,
            max_length=args.max_length,
            padding=True,
            return_tensors="pt",
        )
        enc = {k: v.to(device) for k, v in enc.items()}
        with torch.no_grad():
            logits = model(**enc).logits.detach().cpu().numpy()
        preds.extend(list(np.argmax(logits, axis=-1)))

    report = classification_report(labels, preds, output_dict=True, zero_division=0)
    cm = confusion_matrix(labels, preds).tolist()

    with open(os.path.join(out_dir, "eval_report.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    with open(os.path.join(out_dir, "confusion_matrix.json"), "w", encoding="utf-8") as f:
        json.dump({"confusion_matrix": cm}, f, indent=2)


if __name__ == "__main__":
    main()

