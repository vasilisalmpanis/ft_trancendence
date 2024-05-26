import ftReact          from '../ft_react';
import { apiClient }    from '../api/api_client';
import BarLayout        from '../components/barlayout';
import WebsocketClient  from '../api/websocket_client';
import Avatar           from '../components/avatar';

const units = {
    year  : 24 * 60 * 60 * 1000 * 365,
    month : 24 * 60 * 60 * 1000 * 365/12,
    day   : 24 * 60 * 60 * 1000,
    hour  : 60 * 60 * 1000,
    minute: 60 * 1000,
    second: 1000
  }
  
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  
  const getRelativeTime = (d1, d2 = new Date()) => {
    const elapsed = d1 - d2
  
    // "Math.abs" accounts for both "past" & "future" scenarios
    for (let u in units) 
      if (Math.abs(elapsed) > units[u] || u == 'second') 
        return rtf.format(Math.round(elapsed/units[u]), u)
  }

const SelectedChat = (props) => {
    const [trigger, setTrigger] = ftReact.useState(false);
    const me = JSON.parse(localStorage.getItem('me'));
    const user = props.chat.participants;
    const limit = 10;
    const getOldMsgs = async (chat_id) => {
        if (props.paginator[chat_id] === -1)
            return;
        const resp = await apiClient.get(`/chats/${chat_id}/messages`, {limit: limit, skip: props.paginator[chat_id] || 0});
        if (resp.error) {
            // setError(resp.error);
            return;
        }
        if (resp.length < limit) {
            observer?.disconnect();
            observer = null;
            props.setPaginator({...props.paginator, [chat_id]: -1});
        }
        else
            props.setPaginator({...props.paginator, [chat_id]: (props.paginator[chat_id] || 0) + limit});
        props.updateMsgs(resp, false);
    };
    ftReact.useEffect(async () => {
        if (trigger) {
            setTrigger(false);
            await getOldMsgs(props.chatSelected);
        }
    }, [trigger, getOldMsgs, props.chatSelected]);
    ftReact.useEffect(() => {
        const handleIntersection = (entries) => {
            if (entries[0].isIntersecting && props.chatSelected) {
                setTrigger(true);
            }
        };
        const sentinel = document.getElementById('sentinel');
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        if (sentinel && props.chatSelected && props.paginator[props.chatSelected] !== -1) {
            observer = new IntersectionObserver(handleIntersection, { threshold: 1.0 });
            observer.observe(sentinel);
        }
        return () => {
            if (sentinel && observer) {
                observer.unobserve(sentinel);
                observer.disconnect();
            }
        };
    }, [props.chatSelected, props.paginator, setTrigger]);
    ftReact.useEffect(async () => {
        if (props.chatSelected && !props.msgs.some(msg => msg.chat_id === props.chatSelected)) {
            await getOldMsgs(props.chatSelected, true);
        }
    }, [props.chatSelected, getOldMsgs]);
    return (
            <div className='col-8 px-0 border rounded-end d-flex flex-column justify-content-between'>
                <div className='w-100 border-bottom d-flex flex-row align-items-center justify-content-start gap-3 px-3' style={{height: "4rem"}}>
                        {user && 
                            <img
                                loading="lazy"
                                width={50}
                                style={{objectFit: 'cover', borderRadius: '100%', aspectRatio: '1 / 1'}}
                                src={`https://api.${window.location.hostname}${user.avatar}`}
                                className="img-thumbnail"
                            />
                        }
                        <h3 className='align-middle'>
                            <a onClick={
                                (ev) => {
                                    ev.preventDefault();
                                    props.route(`/users/${user ? user.id : "me"}`);
                                }
                            }>
                                {user ? user.username : "Chat"}
                            </a>
                        </h3>
                </div>
                <div className='d-flex flex-column justify-content-between'>
                    <div
                        id="msgs-container"
                        className='d-flex flex-column align-items-start p-2 text-wrap text-start overflow-y-auto'
                        style={{maxHeight: "70vh", scrollbarWidth: "thin"}}
                    >
                        <div id="sentinel"></div>
                        {console.log(props.msgs)}
                        {   props.chatSelected &&
                            props.msgs &&
                            props.msgs
                                .filter(msg => msg.chat_id === props.chatSelected)
                                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                                .map(msg =>
                                    <div
                                        className={
                                            msg.content
                                                ? (
                                                    msg.sender?.id === me.id
                                                        ? ' align-self-end \
                                                            text-end \
                                                            bg-gray \
                                                            border rounded-4 \
                                                            py-1 px-2 my-1 \
                                                            '
                                                        : ' bg-gray border rounded-4 py-1 px-2 my-1'
                                                )
                                                : 'text-center w-100'
                                        }
                                        style={{wordWrap: "break-word", maxWidth: "75%", overflowWrap: "break-word"}}
                                    >
                                        <div className='d-flex flex-column gap-0'>
                                            <span className='text-break'>
                                                {msg.content ? msg.content : msg.status}
                                            </span>
                                            <span className="align-self-end text-secondary" style={{fontSize: '0.7rem'}}>
                                            {getRelativeTime(new Date(msg.timestamp))}
                                            </span>
                                        </div>
                                    </div>
                                )
                        }
                        <div id="msgs-end" style={{visibility: "hidden"}}/>
                    </div>
                    <form
                        onSubmit={(ev)=>{
                            ev.preventDefault();
                            const msg = ev.target[0].value;
                            if (props.ws) {
                                props.ws.send(JSON.stringify({
                                    chat_id: props.chatSelected,
                                    type: "plain.message",
                                    content: msg
                                }));
                                // props.updateMsgs({content: msg, sender_name: "me"});
                                ev.target[0].value = "";
                            }
                        }}
                    >
                        <div className="input-group mt-auto">
                            <input
                                required
                                type="text"
                                className="form-control"
                                placeholder="New message"
                                aria-describedby="button-addon2"
                            />
                            <button
                                className="btn btn-outline-secondary"
                                type="submit"
                                id="button-addon2"
                            >Send</button>
                        </div>
                    </form>
                </div>
            </div>
    );
};

let observer = null;

const Chats = (props) => {
    const [chats, setChats] = ftReact.useState([]);
    const [error, setError] = ftReact.useState(null);
    const [chatSelected, setChatSelected] = ftReact.useState(null);
    const [msgs, setMsgs] = ftReact.useState([]);
    const [paginator, setPaginator] = ftReact.useState({});
    const [activeFriends, setActiveFriends] = ftReact.useState([]);
    const limit = 10;
    let ws = null;
    // console.log(activeFriends);
    ftReact.useEffect(async () => {
        const getChats = async () => {
            const data = await apiClient.get('/chats');
            if (data.error) {
                setError(data.error);
                return;
            }
            if (data.status === "No chats found") {
                return;
            }
            console.log(data);
            setChats(data);
        };
        if (!chats.length && !error) {
            await getChats();
        }
    }, [chats, setChats, error, setError]);
    const updateActiveUsers = (data) => {
        if (data.type === 'client.update')
            setActiveFriends(data['active_friends_ids']);
        else if (data.type === 'status.update') {
            if (data.status === 'connected')
                setActiveFriends([...activeFriends, data.sender_id]);
            else if (data.status === 'disconnected')
                setActiveFriends(activeFriends.filter(id => id !== data.sender_id))
        }
    };
    ftReact.useEffect(() => {
        ws = new WebsocketClient("wss://api.localhost/ws/chat/dm/", localStorage.getItem("access_token")).getWs();
        ws.addEventListener('message', ev => {
            const data = JSON.parse(ev.data);
            if ("type" in data && data.type === 'plain.message') {
                updateMsgs(data.message);
            };
            if ("type" in data && (data.type === 'status.update' || data.type === 'client.update')) {
                updateActiveUsers(data);
            }
        });
    }, [msgs, setMsgs, updateMsgs]);
    const updateMsgs = (msg, to_end = true) => {
        const msgsContainer = document.getElementById("msgs-container");
        const sentinel = document.getElementById('sentinel');
        observer?.unobserve(sentinel);
        const currentScrollHeight = msgsContainer?.scrollHeight;
        const currentScrollTop = msgsContainer?.scrollTop;
        to_end
            ? setMsgs([...msgs, ...Array.isArray(msg) ? msg : [msg]])
            : setMsgs([...Array.isArray(msg) ? msg : [msg], ...msgs]);
        to_end
            ? setTimeout(
		    	() => document.getElementById("msgs-end")?.scrollIntoView(),
		    	100
		    )
            : setTimeout(() => {
                const newScrollHeight = msgsContainer.scrollHeight;
                msgsContainer.scrollTop = newScrollHeight - currentScrollHeight + currentScrollTop;
                if (observer && sentinel && chatSelected && paginator[chatSelected] !== -1) {
                    observer.observe(sentinel);
                }
            }, 100);
    };
    return (
        <BarLayout route={props.route}>
            <div className='d-grid w-100 w-md-75 w-xxl-50' style={{minHeight: "75%"}}>
                <div className='row'>
                    <div className={chatSelected ? 'col-4 px-0 border rounded-start' : 'col border rounded px-0'}>
                        <div className='w-100 border-bottom py-3' style={{height: "4rem"}}>
                            <h3 className='align-middle'>Chats</h3>
                        </div>
                        {chats && chats.map((chat) => {
                            return (
                                <div
                                    key={chat.id}
                                    className='border-bottom'
                                    style={{cursor: "pointer", backgroundColor: chatSelected === chat.id ? "green" : ""}}
                                    onClick={async () => {
                                        observer?.disconnect();
                                        observer = null;
                                        document.getElementById("msgs-end")?.scrollIntoView();
                                        setChatSelected(chat.id);
                                    }
                                    }
                                >
                                    <div className='d-flex flex-row justify-content-start align-items-center gap-2 p-2'>
                                        <Avatar img={chat.participants.avatar} size={'40rem'}/>
                                        {chat.participants.username}
                                        {console.log('participant', chat.participants.id, activeFriends)}
                                        {activeFriends && activeFriends.includes(chat.participants.id) &&
                                            <span class="p-2 bg-success border border-light rounded-circle">
                                                <span class="visually-hidden">Active User</span>
                                                
                                            </span>
                                        }
                                    </div>   
                                </div>
                            );
                        })}
                    </div>
                    {   chatSelected && 
                        chats &&
                        <SelectedChat
                            chatSelected={chatSelected}
                            chat={chats.find(chat => chat.id === chatSelected)}
                            msgs={msgs}
                            ws={ws}
                            updateMsgs={updateMsgs}
                            paginator={paginator}
                            setPaginator={setPaginator}
                            route={props.route}
                        />
                    }
                </div>
            </div>
        </BarLayout>
    );
}

export default Chats;