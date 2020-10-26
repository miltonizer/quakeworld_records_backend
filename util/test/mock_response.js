const mockResponse = () => {
    const res = {};
    res.status = jest.fn( (statusCode) => {
        res.statusCode = statusCode;
        return res;
    });
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn( (messageKey) => {
        res.messageKey = messageKey;
        return res;
    });
    return res;
};

module.exports = mockResponse;