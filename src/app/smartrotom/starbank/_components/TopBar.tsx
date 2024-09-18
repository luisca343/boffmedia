export default function TopBar(){
    return(
        <header className="bg-blue-950 shadow-md">
          <div className="h-20 mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-white">
              
            </h1>
            <div className="flex items-center">
              <img
                className="h-8 w-8 rounded-full"
                src="https://minotar.net/avatar/Luisca343/80.png"
                alt="User avatar"
              />
            </div>
          </div>
        </header>
    )
}