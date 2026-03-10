const samLib = require("../response-codes/lib");

function globalErrorHandler(error, req, res, next) {
  const errorStatus = 400 || 500;
  res.set("Access-Control-Allow-Origin", "*");
  if (error.message && parseInt(error.message) > 0 && !error.message.includes(",")) {
    let errorStatement = {
      responseId: req.body.requestHeader?.requestId,
      responseCode: error.message,
      responseMessage: samLib.responsecodes().getStatusText(error.message),
      responseMessageList: [],
    };
    res.status(errorStatus).json(errorStatement);
  } else if (error?.message && error.message.includes(",")) {
    const errorMessageParts = error.message.split(",");
    var result = [];
    errorMessageParts.forEach((part) => {
      result.push(samLib.responsecodes().getStatusText(part.trim()));
    });
    let errorStatement = {
      responseCode: samLib.responsecodes().INVALID_REQUEST,
      responseMessage: samLib.responsecodes().getStatusText(samLib.responsecodes().INVALID_REQUEST),
      responseMessageList: result,
    };
    res.status(errorStatus).json(errorStatement);
  } else {
    const errorMessage = error.message || error || error.NotAuthorizedException || "Something Went Wrong Plz Try Again";
    let errorStatement = {
      responseCode: errorStatus,
      responseMessage: errorMessage,
      responseMessageList: [],
    };
    res.status(errorStatus).json(errorStatement);
  }
}

module.exports = globalErrorHandler;
