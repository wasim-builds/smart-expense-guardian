import kagglehub
import shutil
import os

print("Downloading dataset...")
path = kagglehub.dataset_download("kartik2112/fraud-detection")
print(f"Dataset downloaded to {path}")

# Source file path
src_file = os.path.join(path, "fraudTrain.csv")

# Destination path
os.makedirs("data", exist_ok=True)
dst_file = os.path.join("data", "fraudTrain.csv")

print(f"Copying {src_file} to {dst_file}...")
shutil.copy2(src_file, dst_file)
print("Done!")
