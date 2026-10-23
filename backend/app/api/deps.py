import socket 
website = input("Enter the website Url")
socket_result =  socket.gethostbyname(website)
print(f"The IP address of {website} is {socket_result}")