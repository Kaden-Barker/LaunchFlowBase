import HamburgerNav from "@/components/hamburgerNav";
import { useNavigate } from "react-router-dom";

const HelpSearchingData = () => {
  const navigate = useNavigate(); 

  const handleBackClick = () => {
    navigate(-1); // Navigate to the previous page in history
  }

  const sections = [
    {
      title: "Basic Search",
      content: [
        "This search offers two options: AI Search or a DSL Search?",
        "The AI Search will allow you to type in what your looking for such as cows that have a yearly weight of 900, and it will return the data for that. However this search isn't free, there is a small charge to use the AI.",
        "The DSL Search is free and allows you to search the same thing, however it requires you to search in a specific way. <strong>We recommend using the AI search until you get the hang of the DSL Language.</strong>",
        "Once the search is complete you will be able to filter the results by date, hide columns, and export the shown data."        
      ]
    },
    {
      title: "Understanding Search Results",
      content: [
        "Each row in the results table represents a single asset or entry of data",
        "Each column is a field of data for that asset",
        "Each column has a date associated with it, they are hidden by defualt but can be shown by clicking the date button in the top right of the table"
      ]
    },
    {
      title: "Filtering Results",
      content: [
        "Use the category and group dropdowns to narrow down your search",
        "The filters work together - selecting a category will update available groups",
        "You can clear filters using the 'Clear' button",
        "The number of results will update automatically as you apply filters"
      ]
    },
    {
      title: "What is a DSL Query?",
      content: [
        "A DSL Query is a way to search for data using a specific language. It is a free way to search your data.",
        "DSL stands for Domain Specific Language, it is a language that is used to search for data in a specific way.",
        "Our DSL is structured like so, 'Group.Field operator value' Example: 'cows.yearly_weight > 800'",
        "The allowed operators are: ==, !=, >, <, >=, <=, is, like.",
        "One thing to note is that the DSL Search requires it to be typed in exactly this format, names, spaces, case, etc all matter."
      ]
    },
    {
      title: "Tutorial Video",
      content: [
        "Click the video below to watch a tutorial on how to search data",
        "This video will show you how to use the search filters",
        "This video will also show you how to interpret search results"
      ],
      video: "https://www.youtube.com/embed/BmYAcU6TAXA"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen w-screen bg-gray-100">
      {/* Header Bar */}
      <header className="relative bg-[#876454] text-white shadow-lg flex items-center justify-center py-6 px-4 md:px-8">
        {/* Logo (top-left) */}
        <img 
          src="/rgf_logo.png"
          alt="RGF Logo" 
          className="absolute top-2 left-4 max-w-[150px] md:max-w-[165px] h-auto hidden min-[900px]:block"
        />

        {/* Page Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center">
          Searching Data
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
                {section.video && (
                  <div className="mt-4 aspect-video w-full">
                    <iframe
                      src={section.video}
                      title="Tutorial Video"
                      className="w-full h-full rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
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

export default HelpSearchingData;
