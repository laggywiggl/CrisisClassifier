from __future__ import annotations

import argparse
import json
import os
from dataclasses import dataclass

import numpy as np
from datasets import load_dataset
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    DataCollatorWithPadding,
    Trainer,
    TrainingArguments,
)


@dataclass(frozen=True)
class DatasetConfig:
    dataset_id: str = "QCRI/CrisisBench-english"
    text_field: str = "tweet_text"
    label_field: str = "label"


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--dataset_id", default=DatasetConfig.dataset_id)
    p.add_argument("--model_id", default="distilbert-base-uncased")
    p.add_argument("--output_dir", default="ml/artifacts/model")
    p.add_argument("--max_length", type=int, default=256)
    p.add_argument("--batch_size", type=int, default=16)
    p.add_argument("--epochs", type=int, default=2)
    p.add_argument("--lr", type=float, default=2e-5)
    p.add_argument("--seed", type=int, default=42)
    return p.parse_args()


def main() -> None:
    args = parse_args()
    os.makedirs(args.output_dir, exist_ok=True)

    # Dataset schemas vary by benchmark version; try common field names.
    ds = load_dataset(args.dataset_id)

    # Heuristic: use "train"/"validation"/"test" if present; otherwise split train.
    if "validation" not in ds:
        ds = ds["train"].train_test_split(test_size=0.1, seed=args.seed)
        train_ds = ds["train"]
        eval_ds = ds["test"]
    else:
        train_ds = ds["train"]
        eval_ds = ds["validation"]

    # Identify text+label columns
    text_col = None
    for candidate in ["tweet_text", "text", "content"]:
        if candidate in train_ds.column_names:
            text_col = candidate
            break
    if text_col is None:
        raise RuntimeError(f"Could not find a text column in dataset columns: {train_ds.column_names}")

    label_col = None
    for candidate in ["label", "labels", "category", "class"]:
        if candidate in train_ds.column_names:
            label_col = candidate
            break
    if label_col is None:
        raise RuntimeError(f"Could not find a label column in dataset columns: {train_ds.column_names}")

    tokenizer = AutoTokenizer.from_pretrained(args.model_id, use_fast=True)

    # Map labels to contiguous IDs if needed
    raw_labels = train_ds[label_col]
    unique_labels = sorted(list(set(raw_labels)))
    label_to_id = {str(l): i for i, l in enumerate(unique_labels)}
    id_to_label = {i: str(l) for str_l, i in label_to_id.items() for l in [str_l]}

    def preprocess(batch):
        toks = tokenizer(batch[text_col], truncation=True, max_length=args.max_length)
        toks["labels"] = [label_to_id[str(x)] for x in batch[label_col]]
        return toks

    train_tok = train_ds.map(preprocess, batched=True, remove_columns=train_ds.column_names)
    eval_tok = eval_ds.map(preprocess, batched=True, remove_columns=eval_ds.column_names)

    model = AutoModelForSequenceClassification.from_pretrained(
        args.model_id,
        num_labels=len(unique_labels),
        id2label=id_to_label,
    )
    # Workaround: transformers expects label2id mapping label->id; keep simple:
    model.config.label2id = {str(l): i for str_l, i in label_to_id.items() for l in [str_l]}
    model.config.id2label = {i: str(l) for str_l, i in label_to_id.items() for l in [str_l]}

    data_collator = DataCollatorWithPadding(tokenizer=tokenizer)

    def compute_metrics(eval_pred):
        logits, labels = eval_pred
        preds = np.argmax(logits, axis=-1)
        return {
            "accuracy": accuracy_score(labels, preds),
            "f1_macro": f1_score(labels, preds, average="macro"),
            "precision_macro": precision_score(labels, preds, average="macro", zero_division=0),
            "recall_macro": recall_score(labels, preds, average="macro", zero_division=0),
        }

    training_args = TrainingArguments(
        output_dir=args.output_dir,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        learning_rate=args.lr,
        num_train_epochs=args.epochs,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        logging_strategy="steps",
        logging_steps=50,
        load_best_model_at_end=True,
        metric_for_best_model="f1_macro",
        greater_is_better=True,
        seed=args.seed,
        report_to=[],
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_tok,
        eval_dataset=eval_tok,
        tokenizer=tokenizer,
        data_collator=data_collator,
        compute_metrics=compute_metrics,
    )

    trainer.train()
    metrics = trainer.evaluate()

    trainer.save_model(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)

    with open(os.path.join(args.output_dir, "metrics.json"), "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    with open(os.path.join(args.output_dir, "label_map.json"), "w", encoding="utf-8") as f:
        json.dump({"label_to_id": label_to_id, "id_to_label": {str(k): v for k, v in model.config.id2label.items()}}, f, indent=2)


if __name__ == "__main__":
    main()

