import React from 'react';
import ReactDOM from 'react-dom';
import SilverStripeComponent from 'lib/SilverStripeComponent';
import i18n from 'i18n';
import DropzoneLib from 'dropzone';
import $ from 'jQuery';
import { getFileExtension } from 'lib/DataFormat';

let idCounter = 0;

class AssetDropzone extends SilverStripeComponent {

  constructor(props) {
    super(props);

    this.dropzone = null;
    this.dragging = false;

    this.handleAddedFile = this.handleAddedFile.bind(this);
    this.handleDragEnter = this.handleDragEnter.bind(this);
    this.handleDragLeave = this.handleDragLeave.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.handleUploadProgress = this.handleUploadProgress.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleSending = this.handleSending.bind(this);
    this.handleSuccess = this.handleSuccess.bind(this);
    this.loadImage = this.loadImage.bind(this);
  }

  componentDidMount() {
    super.componentDidMount();

    const defaultOptions = this.getDefaultOptions();

    let uploadSelector = this.props.uploadSelector;
    if (!uploadSelector && this.props.uploadButton) {
      uploadSelector = '.asset-dropzone__upload-button';
    }

    if (uploadSelector) {
      const found = $(ReactDOM.findDOMNode(this)).find(uploadSelector);
      if (found && found.length) {
        defaultOptions.clickable = found.toArray();
      }
    }

    this.dropzone = new DropzoneLib(
      ReactDOM.findDOMNode(this),
      Object.assign({},
        defaultOptions,
        this.props.options
      ));

    // attach the name as a class to the hidden input for easier identification
    const name = this.props.name;
    if (name) {
      this.dropzone.hiddenFileInput.classList.add(`dz-input-${name}`);
    }

    // Set the user warning displayed when a user attempts to remove a file.
    // If the props hasn't been passed there will be no warning when removing files.
    if (typeof this.props.promptOnRemove !== 'undefined') {
      this.setPromptOnRemove(this.props.promptOnRemove);
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount();

    // Remove all dropzone event listeners.
    this.dropzone.disable();
  }

  render() {
    const className = ['asset-dropzone'];

    if (this.props.className) {
      className.push(this.props.className);
    }

    const buttonProps = {
      className: 'asset-dropzone__upload-button ss-ui-button font-icon-upload',
      type: 'button',
    };

    if (!this.props.canUpload) {
      buttonProps.disabled = true;
    }

    if (this.dragging === true) {
      className.push('dragging');
    }

    return (
      <div className={className.join(' ')}>
        {this.props.uploadButton &&
          <button {...buttonProps}>
            {i18n._t('AssetAdmin.DROPZONE_UPLOAD')}
          </button>
        }
        {this.props.children}
      </div>
    );
  }

  /**
   * Gets the default optiions to instanciate dropzone with.
   *
   * @return object
   */
  getDefaultOptions() {
    return {
      // We handle the queue processing ourself in the FileReader callback.
      // See `this.handleAddedFile`
      autoProcessQueue: false,

      // By default Dropzone adds markup to the DOM for displaying a thumbnail preview.
      // Here we're relpacing that default behaviour with our own React / Redux implementation.
      addedfile: this.handleAddedFile,

      // When the user drags a file into the dropzone.
      dragenter: this.handleDragEnter,

      // When the user's cursor leaves the dropzone while dragging a file.
      dragleave: this.handleDragLeave,

      // When the user drops a file onto the dropzone.
      drop: this.handleDrop,

      // Whenever the file upload progress changes
      uploadprogress: this.handleUploadProgress,

      // The text used before any files are dropped
      dictDefaultMessage: i18n._t('AssetAdmin.DROPZONE_DEFAULT_MESSAGE'),

      // The text that replaces the default message text it the browser is not supported
      dictFallbackMessage: i18n._t('AssetAdmin.DROPZONE_FALLBACK_MESSAGE'),

      // The text that will be added before the fallback form
      // If null, no text will be added at all.
      dictFallbackText: i18n._t('AssetAdmin.DROPZONE_FALLBACK_TEXT'),

      // If the file doesn't match the file type.
      dictInvalidFileType: i18n._t('AssetAdmin.DROPZONE_INVALID_FILE_TYPE'),

      // If the server response was invalid.
      dictResponseError: i18n._t('AssetAdmin.DROPZONE_RESPONSE_ERROR'),

      // If used, the text to be used for the cancel upload link.
      dictCancelUpload: i18n._t('AssetAdmin.DROPZONE_CANCEL_UPLOAD'),

      // If used, the text to be used for confirmation when cancelling upload.
      dictCancelUploadConfirmation: i18n._t(
        'AssetAdmin.DROPZONE_CANCEL_UPLOAD_CONFIRMATION'
      ),

      // If used, the text to be used to remove a file.
      dictRemoveFile: i18n._t('AssetAdmin.DROPZONE_REMOVE_FILE'),

      // Displayed when the maxFiles have been exceeded
      // You can use {{maxFiles}} here, which will be replaced by the option.
      dictMaxFilesExceeded: i18n._t('AssetAdmin.DROPZONE_MAX_FILES_EXCEEDED'),

      // When a file upload fails.
      error: this.handleError,

      // When file file is sent to the server.
      sending: this.handleSending,

      // When a file upload succeeds.
      success: this.handleSuccess,

      thumbnailHeight: 150,

      thumbnailWidth: 200,
    };
  }

  /**
   * Gets a file's category based on its type.
   *
   * @param string fileType - For example 'image/jpg'.
   *
   * @return string
   */
  getFileCategory(fileType) {
    return fileType.split('/')[0];
  }

  /**
   * Event handler triggered when the user drags a file into the dropzone.
   *
   * @param object event
   */
  handleDragEnter(event) {
    if (!this.props.canUpload) {
      return;
    }

    this.dragging = true;
    this.forceUpdate();

    if (typeof this.props.handleDragEnter === 'function') {
      this.props.handleDragEnter(event);
    }
  }

  /**
   * Event handler triggered when a user's curser leaves the dropzone while dragging a file.
   *
   * @param object event
   */
  handleDragLeave(event) {
    const componentNode = ReactDOM.findDOMNode(this);

    if (!this.props.canUpload) {
      return;
    }

    // Event propagation (events bubbling up from decendent elements) means the `dragLeave`
    // event gets triggered on the dropzone.
    // Here we're ignoring events that don't originate from the dropzone node.
    if (event.target !== componentNode) {
      return;
    }

    this.dragging = false;
    this.forceUpdate();

    if (typeof this.props.handleDragLeave === 'function') {
      this.props.handleDragLeave(event, componentNode);
    }
  }

  /**
   * Event handler when a file's upload progress changes.
   *
   * @param object file - File interface. See https://developer.mozilla.org/en-US/docs/Web/API/File
   * @param integer progress - the upload progress percentage
   * @param integer bytesSent - total bytesSent
   */
  handleUploadProgress(file, progress, bytesSent) {
    if (typeof this.props.handleUploadProgress === 'function') {
      this.props.handleUploadProgress(file, progress, bytesSent);
    }
  }

  /**
   * Event handler triggered when the user drops a file on the dropzone.
   *
   * @param object event
   */
  handleDrop(event) {
    this.dragging = false;
    this.forceUpdate();

    if (typeof this.props.handleDrop === 'function') {
      this.props.handleDrop(event);
    }
  }

  /**
   * Called just before the file is sent. Gets the `xhr` object as second parameter,
   * so you can modify it (for example to add a CSRF token)
   * and a `formData` object to add additional information.
   *
   * @param object file - File interface. See https://developer.mozilla.org/en-US/docs/Web/API/File
   * @param object xhr
   * @param object formData - FormData interface. See https://developer.mozilla.org/en-US/docs/Web/API/FormData
   */
  handleSending(file, xhr, formData) {
    // Allow submitted data to be decorated
    if (typeof this.props.updateFormData === 'function') {
      this.props.updateFormData(formData);
    }
    formData.append('SecurityID', this.props.securityID);
    formData.append('ParentID', this.props.folderId);

    const newXhr = Object.assign({}, xhr, {
      abort: () => {
        this.dropzone.cancelUpload(file);
        xhr.abort();
      },
    });
    if (typeof this.props.handleSending === 'function') {
      this.props.handleSending(file, newXhr, formData);
    }
  }

  /**
   * Generate unique ID
   *
   * @returns {String}
   */
  generateQueuedId() {
    return ++idCounter;
  }

  /**
   * Event handler for files being added. Called before the request is made to the server.
   *
   * @param file (object) - File interface. See https://developer.mozilla.org/en-US/docs/Web/API/File
   */
  handleAddedFile(file) {
    if (this.props.options.maxFiles && this.dropzone.files.length > this.props.options.maxFiles) {
      this.dropzone.removeFile(this.dropzone.files[0]);
      if (typeof this.props.handleMaxFilesExceeded === 'function') {
        // can add a warning message here
        this.props.handleMaxFilesExceeded(file);
      }
      // shouldn't return error, as there isn't a way to catch it...
      return Promise.resolve();
    }

    // check with parent if there are other forms of validation to be done
    if (typeof this.props.canFileUpload === 'function' && !this.props.canFileUpload(file)) {
      this.dropzone.removeFile(file);
      return Promise.resolve();
    }

    if (!this.props.canUpload) {
      this.dropzone.removeFile(file);
      return Promise.reject(new Error(i18n._t('AssetAdmin.DROPZONE_CANNOT_UPLOAD')));
    }

    // The queuedId is used to uniquely identify file while it's in the queue.
    // eslint-disable-next-line no-param-reassign
    file._queuedId = this.generateQueuedId();

    const loadPreview = new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        // If the user uploads multiple large images, we could run into memory issues
        // by simply using the `event.target.result` data URI as the thumbnail image.
        //
        // To get avoid this we're creating a canvas, using the dropzone thumbnail dimensions,
        // and using the canvas data URI as the thumbnail image instead.

        if (this.getFileCategory(file.type) === 'image') {
          const img = document.createElement('img');

          resolve(this.loadImage(img, event.target.result));
        } else {
          resolve({});
        }
      };

      reader.readAsDataURL(file);
    });

    // JS Synonym for AssetAdmin::getObjectFromData()
    return loadPreview.then((preview) => {
      const details = {
        height: preview.height,
        width: preview.width,
        category: this.getFileCategory(file.type),
        filename: file.name,
        queuedId: file._queuedId,
        size: file.size,
        title: this.getFileTitle(file.name),
        extension: getFileExtension(file.name),
        type: file.type,
        url: preview.thumbnailURL,
        thumbnail: preview.thumbnailURL,
        smallThumbail: preview.thumbnailURL,
      };

      this.props.handleAddedFile(details);
      this.dropzone.processFile(file);

      return details;
    });
  }

  /**
   * JS Synonym for File::setName()
   *
   * @param {String} filename
   * @returns {String}
   */
  getFileTitle(filename) {
    return filename
      .replace(/[.][^.]+$/, '')
      .replace(/-_/, ' ');
  }

  /**
   * Returns a promise for loading an image to get the dataURL for previewing.
   *
   * @param img (image)
   * @param newSource (string)
   * @returns {Promise}
   */
  loadImage(img, newSource) {
    return new Promise((resolve) => {
      // eslint-disable-next-line no-param-reassign
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        // two times for retina
        const previewWidth = this.props.preview.width * 2;
        const previewHeight = this.props.preview.height * 2;
        const ratio = img.naturalWidth / img.naturalHeight;

        if (img.naturalWidth < previewWidth
          || img.naturalHeight < previewHeight) {
          // image is smaller than preview, do not need to scale it down
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
        } else if (ratio < 1) {
          // width is less than height, so use width as smallest value
          canvas.width = previewWidth;
          canvas.height = previewWidth / ratio;
        } else {
          // height is less than width, so use height as smallest value
          canvas.width = previewHeight * ratio;
          canvas.height = previewHeight;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const thumbnailURL = canvas.toDataURL('image/png');

        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          thumbnailURL,
        });
      };
      // eslint-disable-next-line no-param-reassign
      img.src = newSource;
    });
  }

  /**
   * Event handler for failed uploads.
   *
   * @param {object} file - File interface. See https://developer.mozilla.org/en-US/docs/Web/API/File
   * @param {string} message
   */
  handleError(file, message) {
    // remove files list, as they are no longer needed
    this.dropzone.removeFile(file);

    if (typeof this.props.handleError === 'function') {
      this.props.handleError(file, message);
    }
  }

  /**
   * Event handler for successfully upload files.
   *
   * @param {object} file - File interface. See https://developer.mozilla.org/en-US/docs/Web/API/File
   */
  handleSuccess(file) {
    // remove files list, as they are no longer needed
    this.dropzone.removeFile(file);

    this.props.handleSuccess(file);
  }

  /**
   * Set the text displayed when a user tries to remove a file.
   *
   * @param {string} userPrompt - The message to display.
   */
  setPromptOnRemove(userPrompt) {
    this.dropzone.options.dictRemoveFileConfirmation = userPrompt;
  }

}

AssetDropzone.propTypes = {
  folderId: React.PropTypes.number.isRequired,
  handleAddedFile: React.PropTypes.func.isRequired,
  handleDragEnter: React.PropTypes.func,
  handleDragLeave: React.PropTypes.func,
  handleDrop: React.PropTypes.func,
  handleError: React.PropTypes.func.isRequired,
  handleSending: React.PropTypes.func,
  updateFormData: React.PropTypes.func,
  handleSuccess: React.PropTypes.func.isRequired,
  handleMaxFilesExceeded: React.PropTypes.func,
  canFileUpload: React.PropTypes.func,
  options: React.PropTypes.shape({
    url: React.PropTypes.string.isRequired,
  }),
  promptOnRemove: React.PropTypes.string,
  securityID: React.PropTypes.string.isRequired,
  uploadButton: React.PropTypes.bool,
  uploadSelector: React.PropTypes.string,
  canUpload: React.PropTypes.bool.isRequired,
  preview: React.PropTypes.shape({
    width: React.PropTypes.number,
    height: React.PropTypes.number,
  }),
  className: React.PropTypes.string,
};

AssetDropzone.defaultProps = {
  uploadButton: true,
};

export default AssetDropzone;
