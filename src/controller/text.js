let response = await axios.get("http://206.189.135.17/api/get-enroute-booking-by-group", {
    headers: {
      authorization:
        "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiYjZiODkxYWM0YzVkNTFjNjM3MjRlOGEyZTk2YTFjMjAyYTQ4Y2I3MTdlYTE1NDMzYTFlZGM5YTZhZGZiOWI2YTEyYjU4Yzg3ODM4MDIzZWIiLCJpYXQiOjE3MzM3NTYyMjQuMjkxNjEsIm5iZiI6MTczMzc1NjIyNC4yOTE2MTQsImV4cCI6MTc2NTI5MjIyNC4yODYyMDksInN1YiI6IjEiLCJzY29wZXMiOltdfQ.PD7gP-0kwpnYOAswB6jz32JH8mt9X1fi1Ov6ixheIyTgEkdja0CJM14aGpfwxvYY9bjzRFV99SKmpos0I_bbG0Osq9gfWFfGaZmXXfH3Fn0w9skTWFxgvCrzNRNZ3bWY9nwxIjt8yWVqll-UHBRS_bwXtQ8xqNpiamyM5eYviaCxxYNtVbQWK5CNYhqTVs5S6FNIE35f-LXZmAD42XgsnMACk6PT5VkGhWDJ5IwmDa1KVYufT3qtXf3qTW_kJLOg08DDqo0pDFA8T4N0QlcwlZzZFdxRq2pzHUm4ZhDm5jDnYr32GpQINzuItOzFN4saLPkzUNJGmJZdzL17clIMZGyRmRqRryTFl2_pTC2V48iAZ4YRge1hpH_EEnQMguI668xrGrtXiMmryJi-wO6nrwA3Yct9xMxLpa6cCt8bh540y_6bkdpezg_A6mt36s7v8xrelOfIZZYq5fck-399GTIVSGc5P-2w-sDWfA3ICoK2Z7mIf2wkpQdatq7priraOcI1Jzqwiex-rPEUrUhCnWa4qUHbMv-1bXFrAOgFZjOv9e5HtpMQDoi19hTOycakVcopjKoJ37e0cJYbOvgZo_NJXESjU73ctw56KM6GFBjkeQcb7MjIJQtHb4G8sUlNfFPb8bn27F3ZGxXZtfxjYQFqSF1Z-P7pSXS4KOqM9eI",
    },
  });
  
  const rideData = response?.data?.data || [];
  const combinedRides = rideData.flat();
  const myData = combinedRides?.filter((v, i)=>{
     return(
      v?.id == bookingId
     )
  })
  console.log(myData[0]?.user_details?.device_id);