exports.sendResponse = (res, code, message, data) => {
    if (data) {
      data = data;
    }
    return res.status(code).json(data);
  };
  