import os
import io
import pandas as pd
import matplotlib.pyplot as plt
from flask import Flask, request, send_file
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Folder to store uploaded files and generated images
UPLOAD_FOLDER = './uploads'
GENERATED_IMAGES_FOLDER = './generated_images'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['GENERATED_IMAGES_FOLDER'] = GENERATED_IMAGES_FOLDER

# Allowed file extensions for CSV
ALLOWED_EXTENSIONS = {'csv'}

# Check if file is allowed
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Generate visualization from CSV data
def generate_visualization(csv_file_path):
    # Read CSV file
    df = pd.read_csv(csv_file_path)

    # Create a simple plot (this can be customized based on your data)
    plt.figure(figsize=(10, 6))
    df.plot(kind='bar', figsize=(10, 6))  # Modify this based on your desired plot type
    plt.title('CSV Data Visualization')
    plt.xlabel('Index')
    plt.ylabel('Values')

    # Save the figure to a buffer (in memory)
    img_buf = io.BytesIO()
    plt.savefig(img_buf, format='png')
    img_buf.seek(0)  # Reset buffer position to the beginning

    return img_buf

# Endpoint to receive the CSV file and generate visualization
@app.route('/visualize', methods=['POST'])
def visualize():
    if 'file' not in request.files:
        return "No file part", 400

    file = request.files['file']
    if file.filename == '':
        return "No selected file", 400

    if file and allowed_file(file.filename):
        # Save uploaded file to the upload folder
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        # Generate visualization
        img_buf = generate_visualization(file_path)

        # Save generated image
        output_image_path = os.path.join(GENERATED_IMAGES_FOLDER, 'visualization.png')
        with open(output_image_path, 'wb') as f:
            f.write(img_buf.read())

        # Send the generated image as response
        return send_file(output_image_path, mimetype='image/png')

    return "Invalid file format", 400

if __name__ == '__main__':
    # Ensure the upload and generated images folder exist
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(GENERATED_IMAGES_FOLDER, exist_ok=True)
    
    app.run(host='0.0.0.0', port=8045)
