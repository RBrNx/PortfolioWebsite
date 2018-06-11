using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Website
{

    public class WebDeveloper
    {
        public string Name { get; set; }
        public int Age { get; set; }
        public int YearsExperience { get; set; }
        public List<string> Languages { get; set; }
        public string Notes { get; set; }

    }

    class WebSiteIntro
    {
        static void Main(string[] args)
        {
            WebDeveloper David = new WebDeveloper
            {
                Name = "David Mimnagh",
                Age = 24,
                YearsExperience = 2,
                Languages = new string[] { "C#", "Javascript", "SQL", "LINQ", "HTML", "CSS", "C++", "Java" }.ToList(),
                Notes = @"Hi, I'm David a .NET developer based in Glasgow....
                            I gratuated from the University of the West of Scotland with a 2:1 Honours Degree, in Computer Games Technology.
                            I use C#, Javascript, SQL, LINQ, Html, and CSS on a daily basis. I also have experience with C++ and Java from university.
                            In my spare time I enjoy creating my own programs, watching football, doing puzzles, and playing games.
                            For any queries or questions you have, please, feel free to contact me."
            };

        }
    }
}