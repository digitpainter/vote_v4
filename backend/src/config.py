from pathlib import Path
import os

# 基础目录
BASE_DIR = Path(__file__).parent.parent

# 上传目录配置
UPLOAD_DIR = BASE_DIR / "uploads"
IMAGES_DIR = UPLOAD_DIR / "images"

# 确保目录存在
os.makedirs(IMAGES_DIR, exist_ok=True)

# 图片相关配置
IMAGE_CONFIG = {
    "max_size": 2 * 1024 * 1024,  # 2MB
    "allowed_extensions": [".jpg", ".jpeg", ".png", ".gif"],
}

# 基础URL配置（实际部署时需要修改）
BASE_URL = "http://localhost:8000" 