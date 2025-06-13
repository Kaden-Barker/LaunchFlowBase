import HamburgerNav from "@/components/hamburgerNav";
import { useNavigate } from "react-router-dom";

const HelpManagingUsers = () => {
  const navigate = useNavigate(); 

  const handleBackClick = () => {
    navigate(-1); // Navigate to the previous page in history
  }

  const sections = [
    {
        title: "Navigating",
        content: [
            "When the page is open you will see a table for all of the registered users. It's important to know that a user can login into the page with their rusted gate email however they cannot do anything unless they have been added to this users page.",
            "At the bottom of the page you will see a display of the different groups and what each group is allowed to do.",
            "Just above each section there is a button to add a new user and a new group."
        ]
    },
    {
      title: "Managing User",
      content: [
        "To add a new user, click the 'Add User' button at the top of the page.",
        "You will be prompted to enter the user's email, name, and initial role.",
        "All of the groups are listed in the dropdown menu, you can assign someone 'No Group' and they won't have access to anything.",
        "On the right of each user there is a pencil icon for updating their information and a trash icon for deleting their account."
      ]
    },
    {
      title: "Managing User Groups",
      content: [
        "To add a new group, click the 'Add Group' button at the top right of the section.",
        "You will be prompted to enter the group's name and to select all of the permissions that the group should be allowed to do.",
        "On the right of each group there is a pencil icon for updating the group's permissions and a trash icon for deleting the group.",
        "If a group is deleted, all of the users for that group will be assigned 'No Group'."
      ]
    },
    {
        title: "Tutorial Video",
        content: [
            "video here"
        ]
    }
  ];

  return (
    <div className="flex flex-col min-h-screen w-screen bg-gray-100">
      {/* Header Bar */}
      <header className="relative bg-[#876454] text-white shadow-lg flex items-center justify-center py-6 px-4 md:px-8">
        {/* Logo (top-left) */}
        <img 
          src="/LaunchFlowLogo.png"
          alt="RGF Logo" 
          className="absolute top-2 left-4 max-w-[150px] md:max-w-[165px] h-auto hidden min-[900px]:block"
        />

        {/* Page Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center">
          Managing Users
        </h1>

        {/* Hamburger Nav */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <HamburgerNav />
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-grow p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {sections.map((section, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-semibold text-[#876454] mb-4">{section.title}</h2>
              <div className="text-gray-700">
                {Array.isArray(section.content) ? (
                  <ul className="list-disc list-inside space-y-2">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-gray-700" dangerouslySetInnerHTML={{ __html: item }} />
                    ))}
                  </ul>
                ) : (
                  <div className="whitespace-pre-line">{section.content}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Back Button */}
      <div className="mt-8 ml-6 sm:ml-10 pb-8">
        <button
          onClick={handleBackClick}
          className="px-6 py-2 sm:px-8 sm:py-3 bg-gray-600 text-white text-base sm:text-lg font-semibold rounded-lg hover:bg-gray-700 transition"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default HelpManagingUsers;
