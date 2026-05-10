from __future__ import annotations

import argparse
import os
import shutil


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--model_dir", required=True, help="Directory created by ml/train.py (contains config.json, model.safetensors, tokenizer files)")
    p.add_argument("--out_dir", default="backend/model", help="Where the backend will load the model from")
    return p.parse_args()


def main() -> None:
    args = parse_args()
    os.makedirs(args.out_dir, exist_ok=True)

    # Minimal, explicit copy of common HF artifacts
    keep = {
        "config.json",
        "model.safetensors",
        "pytorch_model.bin",
        "tokenizer.json",
        "tokenizer_config.json",
        "special_tokens_map.json",
        "vocab.txt",
        "merges.txt",
        "sentencepiece.bpe.model",
        "added_tokens.json",
        "label_map.json",
        "metrics.json",
    }

    for name in os.listdir(args.model_dir):
        src = os.path.join(args.model_dir, name)
        dst = os.path.join(args.out_dir, name)
        if os.path.isdir(src):
            continue
        if name in keep or name.endswith(".json"):
            shutil.copy2(src, dst)

    print(f"Exported model artifacts to: {args.out_dir}")


if __name__ == "__main__":
    main()

