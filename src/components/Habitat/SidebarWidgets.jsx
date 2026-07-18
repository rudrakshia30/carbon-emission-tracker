import { useState, useEffect } from 'react';
import MicroAction from '../QuickLog/MicroAction';
import './SidebarWidgets.css';

const QUOTES = [
  { text: "The greatest threat to our planet is the belief that someone else will save it.", author: "Robert Swan" },
  { text: "We are the first generation to feel the effect of climate change and the last generation who can do something about it.", author: "Barack Obama" },
  { text: "There is no such thing as 'away'. When we throw anything away it must go somewhere.", author: "Annie Leonard" },
  { text: "What you do makes a difference, and you have to decide what kind of difference you want to make.", author: "Jane Goodall" },
  { text: "We do not inherit the earth from our ancestors, we borrow it from our children.", author: "Native American Proverb" }
];

const NEWS = [
  {
    headline: "Global renewable capacity grew by 50% last year",
    summary: "Solar power accounted for three-quarters of additions worldwide.",
    source: "IEA Energy Report"
  },
  {
    headline: "EV sales reach new record highs in 2024",
    summary: "Electric vehicles now make up over 20% of all new car sales globally.",
    source: "Global Auto Trends"
  },
  {
    headline: "New carbon capture plant opens in Iceland",
    summary: "The facility aims to extract 36,000 tons of CO2 from the air every year.",
    source: "Climate Tech News"
  },
  {
    headline: "Wind energy overtakes coal in Europe",
    summary: "For the first time, wind turbines generated more electricity than coal power plants in the EU.",
    source: "Euro Energy Stats"
  }
];

export default function SidebarWidgets({ microAction, onAcceptMicroAction }) {
  const [quoteOfDay, setQuoteOfDay] = useState(QUOTES[0]);
  const [newsOfDay, setNewsOfDay] = useState([NEWS[0], NEWS[1]]);

  useEffect(() => {
    // Pick a pseudo-random quote and news based on today's date
    const todayStr = new Date().toDateString();
    let hash = 0;
    for (let i = 0; i < todayStr.length; i++) {
      hash = todayStr.charCodeAt(i) + ((hash << 5) - hash);
    }

    const quoteIndex = Math.abs(hash) % QUOTES.length;
    const newsIndex1 = Math.abs(hash) % NEWS.length;
    const newsIndex2 = (newsIndex1 + 1) % NEWS.length;

    setTimeout(() => {
      setQuoteOfDay(QUOTES[quoteIndex]);
      setNewsOfDay([NEWS[newsIndex1], NEWS[newsIndex2]]);
    }, 0);
  }, []);

  return (
    <div className="sidebar-widgets">
      {/* Quote of the Day Widget */}
      <div className="widget-card">
        <div className="widget-card__header">
          <span className="widget-card__icon" aria-hidden="true">💭</span>
          <h3 className="widget-card__title">Quote of the Day</h3>
        </div>
        <div className="quote-widget">
          <blockquote className="quote-widget__text">"{quoteOfDay.text}"</blockquote>
          <p className="quote-widget__author">— {quoteOfDay.author}</p>
        </div>
      </div>

      {/* Micro-action suggestion card */}
      {microAction && (
        <MicroAction
          suggestion={microAction}
          onAccept={onAcceptMicroAction}
        />
      )}

      {/* Carbon Emission News Widget */}
      <div className="widget-card">
        <div className="widget-card__header">
          <span className="widget-card__icon" aria-hidden="true">📰</span>
          <h3 className="widget-card__title">Climate News</h3>
        </div>
        <div className="news-widget">
          {newsOfDay.map((newsItem, idx) => (
            <div key={idx} className="news-item">
              <h4 className="news-item__headline">{newsItem.headline}</h4>
              <p className="news-item__summary">{newsItem.summary}</p>
              <span className="news-item__source">{newsItem.source}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
